import Dexie, { type Table } from 'dexie';
import type { UploadedFile, Question, ExamAttempt, UserAnswer } from './models';

export class ExamDatabase extends Dexie {
  uploadedFiles!: Table<UploadedFile, number>;
  questions!: Table<Question, number>;
  examAttempts!: Table<ExamAttempt, number>;
  userAnswers!: Table<UserAnswer, number>;

  constructor() {
    super('ExamGeneratorDB');

    this.version(1).stores({
      uploadedFiles: '++id, name, subject, fileType, processingStatus, uploadDate',
      questions: '++id, subject, questionType, difficulty, taxonomyType, sourceFileId',
      examAttempts: '++id, subject, date',
      userAnswers: '++id, examAttemptId, questionId'
    });
  }
}

export const db = new ExamDatabase();

// Database helper functions
export async function addFile(file: Omit<UploadedFile, 'id'>): Promise<number> {
  return await db.uploadedFiles.add(file);
}

export async function updateFile(id: number, updates: Partial<UploadedFile>): Promise<void> {
  await db.uploadedFiles.update(id, updates);
}

export async function getFilesBySubject(subject: string): Promise<UploadedFile[]> {
  return await db.uploadedFiles.where('subject').equals(subject).toArray();
}

export async function getAllFiles(): Promise<UploadedFile[]> {
  return await db.uploadedFiles.toArray();
}

export async function deleteFile(id: number): Promise<void> {
  await db.uploadedFiles.delete(id);
  // Also delete associated questions
  await db.questions.where('sourceFileId').equals(id).delete();
}

export async function getFileById(id: number): Promise<UploadedFile | undefined> {
  return await db.uploadedFiles.get(id);
}

export async function getPendingFiles(): Promise<UploadedFile[]> {
  return await db.uploadedFiles.where('processingStatus').equals('pending').toArray();
}

export async function getFileStats(): Promise<Record<string, { total: number; processed: number; pending: number }>> {
  const files = await getAllFiles();
  const stats: Record<string, { total: number; processed: number; pending: number }> = {};

  for (const file of files) {
    if (!stats[file.subject]) {
      stats[file.subject] = { total: 0, processed: 0, pending: 0 };
    }
    stats[file.subject].total++;
    if (file.processingStatus === 'completed') {
      stats[file.subject].processed++;
    } else if (file.processingStatus === 'pending' || file.processingStatus === 'processing') {
      stats[file.subject].pending++;
    }
  }

  return stats;
}

// Question helper functions
export async function addQuestion(question: Omit<Question, 'id'>): Promise<number> {
  return await db.questions.add(question);
}

export async function addQuestions(questions: Omit<Question, 'id'>[]): Promise<number[]> {
  return await db.questions.bulkAdd(questions, { allKeys: true }) as number[];
}

export async function getAllQuestions(): Promise<Question[]> {
  return await db.questions.toArray();
}

export async function getQuestionsBySubject(subject: string): Promise<Question[]> {
  return await db.questions.where('subject').equals(subject).toArray();
}

export async function getQuestionById(id: number): Promise<Question | undefined> {
  return await db.questions.get(id);
}

export async function updateQuestion(id: number, updates: Partial<Question>): Promise<void> {
  await db.questions.update(id, updates);
}

export async function deleteQuestion(id: number): Promise<void> {
  await db.questions.delete(id);
}

export async function deleteQuestionsBySourceFile(sourceFileId: number): Promise<number> {
  return await db.questions.where('sourceFileId').equals(sourceFileId).delete();
}

export async function deleteAllQuestions(): Promise<number> {
  return await db.questions.clear().then(() => 0);
}

export async function getQuestionStats(): Promise<Record<string, {
  total: number;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
}>> {
  const questions = await getAllQuestions();
  const stats: Record<string, {
    total: number;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
  }> = {};

  for (const q of questions) {
    if (!stats[q.subject]) {
      stats[q.subject] = {
        total: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0 },
        byType: { multiple_choice: 0, short_answer: 0, fill_in: 0 }
      };
    }
    stats[q.subject].total++;
    stats[q.subject].byDifficulty[q.difficulty]++;
    stats[q.subject].byType[q.questionType]++;
  }

  return stats;
}

export async function getQuestionsForExam(
  subject: string,
  count: number,
  options?: {
    difficulty?: string;
    questionType?: string;
    excludeIds?: number[];
  }
): Promise<Question[]> {
  let query = db.questions.where('subject').equals(subject);

  let questions = await query.toArray();

  // Apply filters
  if (options?.difficulty && options.difficulty !== 'all') {
    questions = questions.filter(q => q.difficulty === options.difficulty);
  }
  if (options?.questionType && options.questionType !== 'all') {
    questions = questions.filter(q => q.questionType === options.questionType);
  }
  if (options?.excludeIds?.length) {
    questions = questions.filter(q => !options.excludeIds!.includes(q.id!));
  }

  // Shuffle and take requested count
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
