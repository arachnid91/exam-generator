import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { ExamResult } from '../../services/examService';
import { formatTime } from '../../services/examService';
import { exportResultsToPdf } from '../../services/pdfExportService';
import { SUBJECT_COLORS } from '../../db/models';
import type { Subject } from '../../db/models';

interface ExamResultsProps {
  result: ExamResult;
  subject: Subject;
  onRetake: () => void;
  onNewExam: () => void;
}

export function ExamResults({ result, subject, onRetake, onNewExam }: ExamResultsProps) {
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLabel = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 70) return 'Good Job!';
    if (score >= 50) return 'Needs Work';
    return 'Keep Practicing';
  };

  const filteredResults = result.questionResults.filter(qr => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'correct') return qr.isCorrect;
    if (reviewFilter === 'incorrect') return !qr.isCorrect && qr.userAnswer;
    if (reviewFilter === 'skipped') return !qr.userAnswer;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Score Card */}
      <Card className="text-center mb-6">
        <div className={`text-6xl font-bold mb-2 ${getGradeColor(result.score)}`}>
          {result.score}%
        </div>
        <div className={`text-xl font-medium ${getGradeColor(result.score)} mb-4`}>
          {getGradeLabel(result.score)}
        </div>

        <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 mb-6">
          <span className={`px-3 py-1 rounded ${SUBJECT_COLORS[subject]}`}>
            {subject}
          </span>
          <span>
            <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(result.timeTaken)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
            <div className="text-sm text-green-700">Correct</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{result.incorrectAnswers}</div>
            <div className="text-sm text-red-700">Incorrect</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-600">{result.skipped}</div>
            <div className="text-sm text-gray-700">Skipped</div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3">
          <Button onClick={onRetake}>
            Retake Same Exam
          </Button>
          <Button variant="secondary" onClick={onNewExam}>
            New Exam
          </Button>
          <Button
            variant="ghost"
            onClick={() => exportResultsToPdf(result, subject)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </Button>
        </div>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* By Difficulty */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">By Difficulty</h3>
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as const).map(diff => {
              const data = result.performanceByDifficulty[diff];
              if (data.total === 0) return null;
              const percent = Math.round((data.correct / data.total) * 100);

              return (
                <div key={diff} className="flex items-center">
                  <span className={`w-16 text-sm ${
                    diff === 'easy' ? 'text-green-700' :
                    diff === 'medium' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden mx-3">
                    <div
                      className={`h-full rounded-full ${
                        diff === 'easy' ? 'bg-green-500' :
                        diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-gray-600">
                    {data.correct}/{data.total}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* By Type */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">By Question Type</h3>
          <div className="space-y-3">
            {([
              { key: 'multiple_choice', label: 'Multiple Choice' },
              { key: 'short_answer', label: 'Short Answer' },
              { key: 'fill_in', label: 'Fill in Blank' }
            ] as const).map(({ key, label }) => {
              const data = result.performanceByType[key];
              if (data.total === 0) return null;
              const percent = Math.round((data.correct / data.total) * 100);

              return (
                <div key={key} className="flex items-center">
                  <span className="w-24 text-sm text-gray-700 truncate">{label}</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden mx-3">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-sm text-gray-600">
                    {data.correct}/{data.total}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Review Button */}
      <Button
        variant="secondary"
        onClick={() => setShowReview(!showReview)}
        className="w-full mb-4"
      >
        {showReview ? 'Hide Review' : 'Review Answers'}
      </Button>

      {/* Question Review */}
      {showReview && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-sm text-gray-600">Filter:</span>
            {(['all', 'correct', 'incorrect', 'skipped'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setReviewFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm ${
                  reviewFilter === filter
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredResults.map((qr, idx) => (
              <Card key={idx} padding="sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                      qr.isCorrect ? 'bg-green-500' :
                      qr.userAnswer ? 'bg-red-500' : 'bg-gray-400'
                    }`}>
                      {qr.isCorrect ? '✓' : qr.userAnswer ? '✗' : '—'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      qr.question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      qr.question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {qr.question.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(qr.timeSpent)}
                  </span>
                </div>

                <p className="text-sm text-gray-900 mb-3">{qr.question.questionText}</p>

                {qr.question.options && (
                  <div className="space-y-1 mb-3">
                    {qr.question.options.map((opt, optIdx) => {
                      const letter = opt.charAt(0).toLowerCase();
                      const isCorrect = qr.question.correctAnswer.toLowerCase().startsWith(letter);
                      const isUserAnswer = qr.userAnswer?.toLowerCase() === letter;

                      return (
                        <div
                          key={optIdx}
                          className={`px-3 py-1.5 rounded text-sm ${
                            isCorrect
                              ? 'bg-green-100 text-green-800'
                              : isUserAnswer
                                ? 'bg-red-100 text-red-800'
                                : 'text-gray-600'
                          }`}
                        >
                          {opt}
                          {isCorrect && <span className="ml-2 text-xs">(Correct)</span>}
                          {isUserAnswer && !isCorrect && <span className="ml-2 text-xs">(Your answer)</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!qr.question.options && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24">Your answer:</span>
                      <span className={`text-sm ${qr.userAnswer ? '' : 'text-gray-400 italic'}`}>
                        {qr.userAnswer || 'Skipped'}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-24">Correct:</span>
                      <span className="text-sm text-green-700">{qr.question.correctAnswer}</span>
                    </div>
                  </div>
                )}

                <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                  <strong>Explanation:</strong> {qr.question.explanation}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
