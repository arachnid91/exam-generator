import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SUBJECTS, SUBJECT_COLORS } from '../../db/models';
import type { ExamConfig } from '../../services/examService';

interface ExamConfigProps {
  questionStats: Record<string, { total: number; byDifficulty: Record<string, number>; byType: Record<string, number> }>;
  onStart: (config: ExamConfig) => void;
}

export function ExamConfigComponent({ questionStats, onStart }: ExamConfigProps) {
  const [config, setConfig] = useState<ExamConfig>({
    subject: 'PR',
    questionCount: 10,
    difficulty: 'all',
    questionType: 'all',
    timeLimit: 0,
    showImmediateFeedback: false
  });

  const availableQuestions = questionStats[config.subject]?.total || 0;
  const maxQuestions = Math.min(50, availableQuestions);

  const handleStart = () => {
    if (availableQuestions === 0) return;
    onStart({
      ...config,
      questionCount: Math.min(config.questionCount, availableQuestions)
    });
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Configure Your Exam</h2>

      {/* Subject Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subject
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SUBJECTS.map(subject => {
            const count = questionStats[subject]?.total || 0;
            const isSelected = config.subject === subject;

            return (
              <button
                key={subject}
                onClick={() => setConfig(prev => ({ ...prev, subject }))}
                disabled={count === 0}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : count === 0
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[subject]} mb-2`}>
                  {subject}
                </span>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">questions</div>
              </button>
            );
          })}
        </div>
      </div>

      {availableQuestions > 0 ? (
        <>
          {/* Question Count */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={1}
                max={maxQuestions}
                value={Math.min(config.questionCount, maxQuestions)}
                onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                className="flex-1"
              />
              <div className="w-16 text-center">
                <input
                  type="number"
                  min={1}
                  max={maxQuestions}
                  value={config.questionCount}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    questionCount: Math.max(1, Math.min(maxQuestions, parseInt(e.target.value) || 1))
                  }))}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {maxQuestions} questions available
            </p>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'easy', 'medium', 'hard'] as const).map(diff => {
                const count = diff === 'all'
                  ? availableQuestions
                  : (questionStats[config.subject]?.byDifficulty[diff] || 0);

                return (
                  <button
                    key={diff}
                    onClick={() => setConfig(prev => ({ ...prev, difficulty: diff }))}
                    disabled={count === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.difficulty === diff
                        ? 'bg-blue-600 text-white'
                        : count === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                    <span className="ml-1 text-xs opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type
            </label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'all', label: 'All Types' },
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'short_answer', label: 'Short Answer' },
                { value: 'fill_in', label: 'Fill in Blank' }
              ] as const).map(({ value, label }) => {
                const count = value === 'all'
                  ? availableQuestions
                  : (questionStats[config.subject]?.byType[value] || 0);

                return (
                  <button
                    key={value}
                    onClick={() => setConfig(prev => ({ ...prev, questionType: value }))}
                    disabled={count === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.questionType === value
                        ? 'bg-purple-600 text-white'
                        : count === 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                    <span className="ml-1 text-xs opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Limit */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 0, label: 'No Limit' },
                { value: 10, label: '10 min' },
                { value: 20, label: '20 min' },
                { value: 30, label: '30 min' },
                { value: 45, label: '45 min' },
                { value: 60, label: '60 min' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setConfig(prev => ({ ...prev, timeLimit: value }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.timeLimit === value
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Immediate Feedback */}
          <div className="mb-6">
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={config.showImmediateFeedback}
                  onChange={(e) => setConfig(prev => ({ ...prev, showImmediateFeedback: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  config.showImmediateFeedback ? 'bg-green-600' : 'bg-gray-300'
                }`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.showImmediateFeedback ? 'translate-x-4' : ''
                }`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Antworten sofort anzeigen
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-13">
              Zeigt die richtige Antwort und Erklärung nach jeder Frage (Lernmodus)
            </p>
          </div>

          {/* Start Button */}
          <Button onClick={handleStart} size="lg" className="w-full">
            Start Exam ({config.questionCount} questions)
          </Button>
        </>
      ) : (
        <div className="text-center py-8">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate some questions for {config.subject} in the Questions tab first.
          </p>
        </div>
      )}
    </Card>
  );
}
