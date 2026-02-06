import type { Question, Subject, Difficulty, QuestionType, TaxonomyType } from '../db/models';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

interface GenerationConfig {
  subject: Subject;
  sourceFileId: number;
  count: number;
  difficulty: Difficulty | 'mixed';
  questionTypes: QuestionType[];
  taxonomyTypes: TaxonomyType[];
}

interface GeneratedQuestion {
  questionText: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  taxonomyType: TaxonomyType;
  correctAnswer: string;
  options?: string[];
  explanation: string;
}

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: 'text'; text: string }>;
}

// Store API key in localStorage (in production, use secure storage)
export function getApiKey(): string | null {
  return localStorage.getItem('claude_api_key');
}

export function setApiKey(key: string): void {
  localStorage.setItem('claude_api_key', key);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function clearApiKey(): void {
  localStorage.removeItem('claude_api_key');
}

async function callClaudeAPI(messages: ClaudeMessage[], systemPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not configured. Please set your Claude API key in settings.');
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || `API request failed: ${response.status}`);
  }

  const data: ClaudeResponse = await response.json();
  return data.content[0].text;
}

function buildSystemPrompt(config: GenerationConfig): string {
  const difficultyGuide = {
    easy: 'Basic recall and recognition questions. Test fundamental concepts and definitions.',
    medium: 'Application and analysis questions. Require understanding relationships between concepts.',
    hard: 'Synthesis and evaluation questions. Require critical thinking and complex problem-solving.'
  };

  const taxonomyGuide = {
    recall: 'Questions testing memory and recognition of facts, terms, and basic concepts.',
    conceptual: 'Questions testing understanding of ideas, comparing, and explaining concepts.',
    application: 'Questions requiring application of knowledge to new situations or problems.'
  };

  const typeGuide = {
    multiple_choice: 'Multiple choice with 4 options (A, B, C, D). One correct answer.',
    short_answer: 'Short answer questions requiring 1-3 sentence responses.',
    fill_in: 'Fill in the blank questions with a single word or short phrase answer.'
  };

  return `You are an expert exam question generator for university courses. Your task is to generate high-quality exam questions based on provided course material.

Subject: ${config.subject}

QUESTION REQUIREMENTS:
- Generate exactly ${config.count} questions
- Difficulty levels: ${config.difficulty === 'mixed' ? 'Mix of easy, medium, and hard' : difficultyGuide[config.difficulty]}
- Question types to include: ${config.questionTypes.map(t => typeGuide[t]).join('; ')}
- Taxonomy types: ${config.taxonomyTypes.map(t => taxonomyGuide[t]).join('; ')}

IMPORTANT GUIDELINES:
1. Questions must be directly based on the provided content
2. Avoid questions about "Beispiel" (example) sections
3. For German content, questions can be in German or English based on the source material
4. Multiple choice options should be plausible but have only ONE correct answer
5. Explanations should reference the source material
6. Ensure questions are clear and unambiguous

OUTPUT FORMAT:
Return a JSON array of question objects with this exact structure:
[
  {
    "questionText": "The question text",
    "questionType": "multiple_choice" | "short_answer" | "fill_in",
    "difficulty": "easy" | "medium" | "hard",
    "taxonomyType": "recall" | "conceptual" | "application",
    "correctAnswer": "The correct answer",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "explanation": "Why this is the correct answer, referencing the source material"
  }
]

For short_answer and fill_in questions, omit the "options" field.
Return ONLY the JSON array, no other text.`;
}

export async function generateQuestions(
  sourceText: string,
  config: GenerationConfig,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedQuestion[]> {
  onProgress?.(10, 'Preparing content for analysis...');

  // Truncate text if too long (Claude has context limits)
  const maxLength = 100000;
  const truncatedText = sourceText.length > maxLength
    ? sourceText.slice(0, maxLength) + '\n\n[Content truncated due to length...]'
    : sourceText;

  onProgress?.(20, 'Sending to Claude API...');

  const systemPrompt = buildSystemPrompt(config);
  const userMessage = `Based on the following course material, generate ${config.count} exam questions:

---
${truncatedText}
---

Remember to return ONLY a valid JSON array of questions.`;

  try {
    onProgress?.(30, 'Waiting for Claude response...');

    const response = await callClaudeAPI(
      [{ role: 'user', content: userMessage }],
      systemPrompt
    );

    onProgress?.(80, 'Parsing generated questions...');

    // Parse the JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid response format: Could not find JSON array');
    }

    const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate questions
    const validQuestions = questions.filter(q =>
      q.questionText &&
      q.questionType &&
      q.difficulty &&
      q.taxonomyType &&
      q.correctAnswer &&
      q.explanation
    );

    onProgress?.(100, `Generated ${validQuestions.length} questions`);

    return validQuestions;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse Claude response as JSON. Please try again.');
    }
    throw error;
  }
}

export function questionToDbFormat(
  question: GeneratedQuestion,
  subject: Subject,
  sourceFileId: number
): Omit<Question, 'id'> {
  return {
    subject,
    questionText: question.questionText,
    questionType: question.questionType,
    difficulty: question.difficulty,
    taxonomyType: question.taxonomyType,
    correctAnswer: question.correctAnswer,
    options: question.options,
    explanation: question.explanation,
    sourceFileId,
    timesShown: 0,
    timesCorrect: 0,
    timesIncorrect: 0
  };
}
