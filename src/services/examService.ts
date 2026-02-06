import { db, getQuestionsForExam, updateQuestion } from '../db/database';
import type { Question, ExamAttempt, UserAnswer, Subject, Difficulty, QuestionType, DetailedStats } from '../db/models';

export interface ExamConfig {
  subject: Subject;
  questionCount: number;
  difficulty: Difficulty | 'all';
  questionType: QuestionType | 'all';
  timeLimit: number; // in minutes, 0 for no limit
  showImmediateFeedback: boolean; // show correct answer after each question
}

export interface ActiveExam {
  id: number;
  config: ExamConfig;
  questions: Question[];
  startTime: Date;
  currentIndex: number;
  answers: Map<number, { answer: string; timeSpent: number }>;
}

export interface ExamResult {
  attemptId: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skipped: number;
  score: number;
  timeTaken: number;
  performanceByDifficulty: Record<Difficulty, { correct: number; total: number }>;
  performanceByType: Record<QuestionType, { correct: number; total: number }>;
  questionResults: Array<{
    question: Question;
    userAnswer: string;
    isCorrect: boolean;
    timeSpent: number;
  }>;
}

export async function startExam(config: ExamConfig): Promise<ActiveExam> {
  const questions = await getQuestionsForExam(
    config.subject,
    config.questionCount,
    {
      difficulty: config.difficulty,
      questionType: config.questionType
    }
  );

  if (questions.length === 0) {
    throw new Error('No questions available for the selected criteria. Please generate some questions first.');
  }

  if (questions.length < config.questionCount) {
    console.warn(`Only ${questions.length} questions available, requested ${config.questionCount}`);
  }

  // Create exam attempt record
  const attemptId = await db.examAttempts.add({
    subject: config.subject,
    date: new Date(),
    questionIds: questions.map(q => q.id!),
    score: 0,
    timeTaken: 0,
    performanceByDifficulty: {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    },
    performanceByType: {
      multiple_choice: { correct: 0, total: 0 },
      short_answer: { correct: 0, total: 0 },
      fill_in: { correct: 0, total: 0 }
    }
  });

  return {
    id: attemptId,
    config,
    questions,
    startTime: new Date(),
    currentIndex: 0,
    answers: new Map()
  };
}

export function checkAnswer(question: Question, userAnswer: string): boolean {
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = question.correctAnswer.trim().toLowerCase();

  if (question.questionType === 'multiple_choice') {
    // For MC, check if user selected the correct option letter or the full answer
    const correctLetter = normalizedCorrect.charAt(0);
    const userLetter = normalizedUser.charAt(0);
    return correctLetter === userLetter || normalizedUser === normalizedCorrect;
  }

  // For short answer and fill in, do a more flexible comparison
  // Remove punctuation and extra spaces
  const cleanUser = normalizedUser.replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');
  const cleanCorrect = normalizedCorrect.replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ');

  // Exact match
  if (cleanUser === cleanCorrect) return true;

  // Check if user answer contains the correct answer (for longer responses)
  if (cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) return true;

  return false;
}

export async function submitExam(exam: ActiveExam): Promise<ExamResult> {
  const endTime = new Date();
  const timeTaken = Math.round((endTime.getTime() - exam.startTime.getTime()) / 1000);

  const performanceByDifficulty: Record<Difficulty, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  };

  const performanceByType: Record<QuestionType, { correct: number; total: number }> = {
    multiple_choice: { correct: 0, total: 0 },
    short_answer: { correct: 0, total: 0 },
    fill_in: { correct: 0, total: 0 }
  };

  const questionResults: ExamResult['questionResults'] = [];
  let correctCount = 0;
  let skippedCount = 0;

  // Process each question
  for (const question of exam.questions) {
    const answerData = exam.answers.get(question.id!);
    const userAnswer = answerData?.answer || '';
    const timeSpent = answerData?.timeSpent || 0;
    const isCorrect = userAnswer ? checkAnswer(question, userAnswer) : false;
    const isSkipped = !userAnswer;

    if (isSkipped) {
      skippedCount++;
    } else if (isCorrect) {
      correctCount++;
    }

    // Update performance tracking
    performanceByDifficulty[question.difficulty].total++;
    performanceByType[question.questionType].total++;

    if (isCorrect) {
      performanceByDifficulty[question.difficulty].correct++;
      performanceByType[question.questionType].correct++;
    }

    // Update question statistics
    await updateQuestion(question.id!, {
      timesShown: (question.timesShown || 0) + 1,
      timesCorrect: (question.timesCorrect || 0) + (isCorrect ? 1 : 0),
      timesIncorrect: (question.timesIncorrect || 0) + (!isCorrect && !isSkipped ? 1 : 0),
      lastShownDate: new Date()
    });

    // Save user answer
    await db.userAnswers.add({
      examAttemptId: exam.id,
      questionId: question.id!,
      userAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date()
    });

    questionResults.push({
      question,
      userAnswer,
      isCorrect,
      timeSpent
    });
  }

  const score = exam.questions.length > 0
    ? Math.round((correctCount / exam.questions.length) * 100)
    : 0;

  // Update exam attempt
  await db.examAttempts.update(exam.id, {
    score,
    timeTaken,
    performanceByDifficulty,
    performanceByType
  });

  return {
    attemptId: exam.id,
    totalQuestions: exam.questions.length,
    correctAnswers: correctCount,
    incorrectAnswers: exam.questions.length - correctCount - skippedCount,
    skipped: skippedCount,
    score,
    timeTaken,
    performanceByDifficulty,
    performanceByType,
    questionResults
  };
}

export async function getExamHistory(subject?: Subject): Promise<ExamAttempt[]> {
  let attempts: ExamAttempt[];

  if (subject) {
    attempts = await db.examAttempts.where('subject').equals(subject).toArray();
  } else {
    attempts = await db.examAttempts.toArray();
  }

  return attempts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
  return await db.examAttempts.get(id);
}

export async function getUserAnswers(attemptId: number): Promise<UserAnswer[]> {
  return await db.userAnswers.where('examAttemptId').equals(attemptId).toArray();
}

export async function deleteExamAttempt(id: number): Promise<void> {
  await db.userAnswers.where('examAttemptId').equals(id).delete();
  await db.examAttempts.delete(id);
}

export async function getOverallStats(): Promise<{
  totalExams: number;
  averageScore: number;
  totalQuestionsSeen: number;
  bestSubject: string | null;
  weakestSubject: string | null;
  recentTrend: 'improving' | 'declining' | 'stable';
  subjectStats: Record<string, {
    exams: number;
    avgScore: number;
    bestScore: number;
    lastAttempt: Date | null;
  }>;
}> {
  const attempts = await db.examAttempts.toArray();

  if (attempts.length === 0) {
    return {
      totalExams: 0,
      averageScore: 0,
      totalQuestionsSeen: 0,
      bestSubject: null,
      weakestSubject: null,
      recentTrend: 'stable',
      subjectStats: {}
    };
  }

  const subjectStats: Record<string, {
    exams: number;
    avgScore: number;
    bestScore: number;
    totalScore: number;
    lastAttempt: Date | null;
  }> = {};

  let totalScore = 0;
  let totalQuestions = 0;

  for (const attempt of attempts) {
    totalScore += attempt.score;
    totalQuestions += attempt.questionIds.length;

    if (!subjectStats[attempt.subject]) {
      subjectStats[attempt.subject] = {
        exams: 0,
        avgScore: 0,
        bestScore: 0,
        totalScore: 0,
        lastAttempt: null
      };
    }

    const ss = subjectStats[attempt.subject];
    ss.exams++;
    ss.totalScore += attempt.score;
    ss.bestScore = Math.max(ss.bestScore, attempt.score);
    if (!ss.lastAttempt || new Date(attempt.date) > ss.lastAttempt) {
      ss.lastAttempt = new Date(attempt.date);
    }
  }

  // Calculate averages
  for (const subject of Object.keys(subjectStats)) {
    const ss = subjectStats[subject];
    ss.avgScore = Math.round(ss.totalScore / ss.exams);
  }

  // Find best and weakest subjects
  const subjectEntries = Object.entries(subjectStats);
  let bestSubject: string | null = null;
  let weakestSubject: string | null = null;

  if (subjectEntries.length > 0) {
    subjectEntries.sort((a, b) => b[1].avgScore - a[1].avgScore);
    bestSubject = subjectEntries[0][0];
    weakestSubject = subjectEntries[subjectEntries.length - 1][0];
  }

  // Calculate recent trend (last 5 vs previous 5)
  let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (attempts.length >= 4) {
    const sorted = [...attempts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recent = sorted.slice(0, Math.min(5, Math.floor(sorted.length / 2)));
    const previous = sorted.slice(Math.min(5, Math.floor(sorted.length / 2)));

    if (previous.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
      const previousAvg = previous.reduce((a, b) => a + b.score, 0) / previous.length;

      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    }
  }

  return {
    totalExams: attempts.length,
    averageScore: Math.round(totalScore / attempts.length),
    totalQuestionsSeen: totalQuestions,
    bestSubject,
    weakestSubject,
    recentTrend,
    subjectStats: Object.fromEntries(
      Object.entries(subjectStats).map(([k, v]) => [k, {
        exams: v.exams,
        avgScore: v.avgScore,
        bestScore: v.bestScore,
        lastAttempt: v.lastAttempt
      }])
    )
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export async function getDetailedStats(): Promise<DetailedStats> {
  const attempts = await db.examAttempts.toArray();

  // Aggregate performance by difficulty
  const performanceByDifficulty: Record<Difficulty, { correct: number; total: number; percentage: number }> = {
    easy: { correct: 0, total: 0, percentage: 0 },
    medium: { correct: 0, total: 0, percentage: 0 },
    hard: { correct: 0, total: 0, percentage: 0 }
  };

  // Aggregate performance by type
  const performanceByType: Record<QuestionType, { correct: number; total: number; percentage: number }> = {
    multiple_choice: { correct: 0, total: 0, percentage: 0 },
    short_answer: { correct: 0, total: 0, percentage: 0 },
    fill_in: { correct: 0, total: 0, percentage: 0 }
  };

  for (const attempt of attempts) {
    // Add difficulty stats
    if (attempt.performanceByDifficulty) {
      for (const [diff, stats] of Object.entries(attempt.performanceByDifficulty)) {
        const d = diff as Difficulty;
        performanceByDifficulty[d].correct += stats.correct;
        performanceByDifficulty[d].total += stats.total;
      }
    }

    // Add type stats
    if (attempt.performanceByType) {
      for (const [type, stats] of Object.entries(attempt.performanceByType)) {
        const t = type as QuestionType;
        performanceByType[t].correct += stats.correct;
        performanceByType[t].total += stats.total;
      }
    }
  }

  // Calculate percentages
  for (const diff of Object.keys(performanceByDifficulty) as Difficulty[]) {
    const stats = performanceByDifficulty[diff];
    stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  }

  for (const type of Object.keys(performanceByType) as QuestionType[]) {
    const stats = performanceByType[type];
    stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  }

  // Progress over time (sorted by date)
  const progressOverTime = attempts
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(a => ({
      date: new Date(a.date).toLocaleDateString(),
      score: a.score,
      subject: a.subject
    }));

  // Weekly progress
  const weeklyData = new Map<string, { scores: number[]; count: number }>();

  for (const attempt of attempts) {
    const date = new Date(attempt.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { scores: [], count: 0 });
    }
    const week = weeklyData.get(weekKey)!;
    week.scores.push(attempt.score);
    week.count++;
  }

  const weeklyProgress = Array.from(weeklyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      avgScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      exams: data.count
    }));

  return {
    performanceByDifficulty,
    performanceByType,
    progressOverTime,
    weeklyProgress
  };
}
