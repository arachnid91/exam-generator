import { useState, useEffect, useCallback } from 'react';
import {
  getAllQuestions,
  deleteQuestion as dbDeleteQuestion,
  updateQuestion as dbUpdateQuestion,
  getQuestionStats,
  addQuestions,
  deleteAllQuestions as dbDeleteAllQuestions
} from '../db/database';
import type { Question, Subject } from '../db/models';

interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: string | null;
  stats: Record<string, {
    total: number;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
  }>;
  refreshQuestions: () => Promise<void>;
  deleteQuestion: (id: number) => Promise<void>;
  deleteAllQuestions: () => Promise<void>;
  updateQuestion: (id: number, updates: Partial<Question>) => Promise<void>;
  addGeneratedQuestions: (questions: Omit<Question, 'id'>[]) => Promise<number[]>;
  getQuestionsBySubject: (subject: Subject) => Question[];
}

export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, {
    total: number;
    byDifficulty: Record<string, number>;
    byType: Record<string, number>;
  }>>({});

  const refreshQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allQuestions = await getAllQuestions();
      setQuestions(allQuestions);
      const questionStats = await getQuestionStats();
      setStats(questionStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuestions();
  }, [refreshQuestions]);

  const deleteQuestion = useCallback(async (id: number) => {
    try {
      await dbDeleteQuestion(id);
      await refreshQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
      throw err;
    }
  }, [refreshQuestions]);

  const deleteAllQuestions = useCallback(async () => {
    try {
      await dbDeleteAllQuestions();
      await refreshQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all questions');
      throw err;
    }
  }, [refreshQuestions]);

  const updateQuestion = useCallback(async (id: number, updates: Partial<Question>) => {
    try {
      await dbUpdateQuestion(id, updates);
      await refreshQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
      throw err;
    }
  }, [refreshQuestions]);

  const addGeneratedQuestions = useCallback(async (newQuestions: Omit<Question, 'id'>[]): Promise<number[]> => {
    try {
      const ids = await addQuestions(newQuestions);
      await refreshQuestions();
      return ids;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions');
      throw err;
    }
  }, [refreshQuestions]);

  const filterBySubject = useCallback((subject: Subject) => {
    return questions.filter(q => q.subject === subject);
  }, [questions]);

  return {
    questions,
    loading,
    error,
    stats,
    refreshQuestions,
    deleteQuestion,
    deleteAllQuestions,
    updateQuestion,
    addGeneratedQuestions,
    getQuestionsBySubject: filterBySubject
  };
}
