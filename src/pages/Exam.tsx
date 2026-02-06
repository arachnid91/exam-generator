import { useState, useCallback } from 'react';
import { ExamConfigComponent } from '../components/Exam/ExamConfig';
import { ExamTaking } from '../components/Exam/ExamTaking';
import { ExamResults } from '../components/Exam/ExamResults';
import { useQuestions } from '../hooks/useQuestions';
import { startExam, type ActiveExam, type ExamResult, type ExamConfig } from '../services/examService';
import { Card } from '../components/ui/Card';

type ExamState = 'config' | 'taking' | 'results';

export function Exam() {
  const { stats, loading } = useQuestions();
  const [examState, setExamState] = useState<ExamState>('config');
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [lastConfig, setLastConfig] = useState<ExamConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartExam = useCallback(async (config: ExamConfig) => {
    setError(null);
    try {
      const exam = await startExam(config);
      setActiveExam(exam);
      setLastConfig(config);
      setExamState('taking');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start exam');
    }
  }, []);

  const handleExamComplete = useCallback((result: ExamResult) => {
    setExamResult(result);
    setExamState('results');
    setActiveExam(null);
  }, []);

  const handleCancelExam = useCallback(() => {
    setActiveExam(null);
    setExamState('config');
  }, []);

  const handleRetake = useCallback(async () => {
    if (lastConfig) {
      await handleStartExam(lastConfig);
    }
  }, [lastConfig, handleStartExam]);

  const handleNewExam = useCallback(() => {
    setExamResult(null);
    setExamState('config');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  const totalQuestions = Object.values(stats).reduce((acc, s) => acc + s.total, 0);

  if (totalQuestions === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Take Exam</h1>
          <p className="mt-1 text-sm text-gray-600">
            Test your knowledge with practice exams.
          </p>
        </div>

        <Card className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No questions available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate some questions in the Questions tab first to take an exam.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {examState === 'config' && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Take Exam</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configure and start a practice exam to test your knowledge.
            </p>
          </div>

          {error && (
            <Card className="mb-4 bg-red-50 border-red-200">
              <div className="flex items-center text-red-700">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            </Card>
          )}

          <ExamConfigComponent
            questionStats={stats}
            onStart={handleStartExam}
          />
        </>
      )}

      {examState === 'taking' && activeExam && (
        <ExamTaking
          exam={activeExam}
          onComplete={handleExamComplete}
          onCancel={handleCancelExam}
        />
      )}

      {examState === 'results' && examResult && lastConfig && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          </div>
          <ExamResults
            result={examResult}
            subject={lastConfig.subject}
            onRetake={handleRetake}
            onNewExam={handleNewExam}
          />
        </>
      )}
    </div>
  );
}
