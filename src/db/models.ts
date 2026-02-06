export type Subject = 'PR' | 'Audio-Visualism' | 'Publicity' | 'Journalism';
export type FileType = 'pdf' | 'png' | 'jpg';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'short_answer' | 'fill_in';
export type TaxonomyType = 'recall' | 'conceptual' | 'application';

export interface UploadedFile {
  id?: number;
  name: string;
  subject: Subject;
  fileType: FileType;
  uploadDate: Date;
  extractedText: string;
  processingStatus: ProcessingStatus;
  errorMessage?: string;
  fileSize: number;
  pageCount?: number;
  fileData?: ArrayBuffer; // Store file binary for processing
}

export interface Question {
  id?: number;
  subject: Subject;
  questionText: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  taxonomyType: TaxonomyType;
  correctAnswer: string;
  options?: string[];
  explanation: string;
  sourceFileId: number;
  timesShown: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastShownDate?: Date;
}

export interface ExamAttempt {
  id?: number;
  subject: Subject;
  date: Date;
  questionIds: number[];
  score: number;
  timeTaken: number;
  performanceByDifficulty: Record<Difficulty, { correct: number; total: number }>;
  performanceByType: Record<QuestionType, { correct: number; total: number }>;
}

export interface UserAnswer {
  id?: number;
  examAttemptId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: Date;
}

// Subject folder mapping for batch import
export const SUBJECT_FOLDER_MAP: Record<string, Subject> = {
  'Public Relations': 'PR',
  'journalismus': 'Journalism',
  'Audiovisueller Jurnalismus': 'Audio-Visualism',
  'publizistik wissenschaft': 'Publicity'
};

export const SUBJECTS: Subject[] = ['PR', 'Audio-Visualism', 'Publicity', 'Journalism'];

export const SUBJECT_COLORS: Record<Subject, string> = {
  'PR': 'bg-blue-100 text-blue-800',
  'Audio-Visualism': 'bg-purple-100 text-purple-800',
  'Publicity': 'bg-green-100 text-green-800',
  'Journalism': 'bg-orange-100 text-orange-800'
};

export interface DetailedStats {
  performanceByDifficulty: Record<Difficulty, { correct: number; total: number; percentage: number }>;
  performanceByType: Record<QuestionType, { correct: number; total: number; percentage: number }>;
  progressOverTime: Array<{
    date: string;
    score: number;
    subject: Subject;
  }>;
  weeklyProgress: Array<{
    week: string;
    avgScore: number;
    exams: number;
  }>;
}
