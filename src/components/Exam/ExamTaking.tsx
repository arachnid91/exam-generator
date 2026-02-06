import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import type { ActiveExam, ExamResult } from '../../services/examService';
import { submitExam, formatTime, checkAnswer } from '../../services/examService';
import { SUBJECT_COLORS } from '../../db/models';

interface ExamTakingProps {
  exam: ActiveExam;
  onComplete: (result: ExamResult) => void;
  onCancel: () => void;
}

export function ExamTaking({ exam, onComplete, onCancel }: ExamTakingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { answer: string; timeSpent: number; isCorrect?: boolean }>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentQuestion = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  const timeLimit = exam.config.timeLimit * 60; // Convert to seconds

  // Store handleSubmit in a ref so we can call it from timer
  const handleSubmitRef = useRef<(() => void) | null>(null);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        // Auto-submit if time limit reached
        if (timeLimit > 0 && newTime >= timeLimit) {
          handleSubmitRef.current?.();
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [timeLimit]);

  // Load saved answer when changing questions
  useEffect(() => {
    const saved = answers.get(currentQuestion.id!);
    setCurrentAnswer(saved?.answer || '');
    setQuestionStartTime(Date.now());
  }, [currentIndex, currentQuestion.id, answers]);

  const saveCurrentAnswer = useCallback((withFeedback = false) => {
    if (currentQuestion) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
      const existing = answers.get(currentQuestion.id!);
      const isCorrect = currentAnswer ? checkAnswer(currentQuestion, currentAnswer) : false;

      setAnswers(prev => {
        const newMap = new Map(prev);
        newMap.set(currentQuestion.id!, {
          answer: currentAnswer,
          timeSpent: (existing?.timeSpent || 0) + timeSpent,
          isCorrect
        });
        return newMap;
      });

      // Show immediate feedback if enabled
      if (withFeedback && exam.config.showImmediateFeedback && currentAnswer) {
        setCurrentFeedback({
          isCorrect,
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation || ''
        });
        setShowFeedback(true);
      }
    }
  }, [currentQuestion, currentAnswer, questionStartTime, answers, exam.config.showImmediateFeedback]);

  const goToQuestion = useCallback((index: number) => {
    if (showFeedback) return; // Don't allow navigation during feedback
    saveCurrentAnswer(false);
    setCurrentIndex(index);
  }, [saveCurrentAnswer, showFeedback]);

  const handleNext = useCallback(() => {
    if (showFeedback) {
      // Continue after seeing feedback
      setShowFeedback(false);
      setCurrentFeedback(null);
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Last question - show results
        setShowConfirmEnd(true);
      }
    } else {
      // Show feedback if enabled and answer given, otherwise just move
      if (exam.config.showImmediateFeedback && currentAnswer) {
        saveCurrentAnswer(true);
      } else {
        saveCurrentAnswer(false);
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }
    }
  }, [saveCurrentAnswer, currentIndex, totalQuestions, showFeedback, exam.config.showImmediateFeedback, currentAnswer]);

  const handlePrev = useCallback(() => {
    if (showFeedback) return; // Don't allow navigation during feedback
    saveCurrentAnswer(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [saveCurrentAnswer, currentIndex, showFeedback]);

  const handleSubmit = useCallback(async () => {
    saveCurrentAnswer();
    setSubmitting(true);

    try {
      // Create updated exam object with answers
      const updatedExam: ActiveExam = {
        ...exam,
        answers: new Map(answers)
      };
      // Add current answer if not already saved
      if (currentQuestion && currentAnswer) {
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
        const existing = updatedExam.answers.get(currentQuestion.id!);
        updatedExam.answers.set(currentQuestion.id!, {
          answer: currentAnswer,
          timeSpent: (existing?.timeSpent || 0) + timeSpent
        });
      }

      const result = await submitExam(updatedExam);
      onComplete(result);
    } catch (error) {
      console.error('Error submitting exam:', error);
      setSubmitting(false);
    }
  }, [exam, answers, currentQuestion, currentAnswer, questionStartTime, saveCurrentAnswer, onComplete]);

  // Keep handleSubmitRef updated
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  const answeredCount = answers.size + (currentAnswer ? 1 : 0);
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const timeRemaining = timeLimit > 0 ? Math.max(0, timeLimit - timeElapsed) : null;
  const isTimeWarning = timeRemaining !== null && timeRemaining < 60;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${SUBJECT_COLORS[exam.config.subject]}`}>
              {exam.config.subject}
            </span>
            <span className="text-sm text-gray-600">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-mono ${isTimeWarning ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
              {timeRemaining !== null ? (
                <>
                  <svg className="w-5 h-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(timeRemaining)}
                </>
              ) : (
                formatTime(timeElapsed)
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowConfirmEnd(true)}>
              End Exam
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={progressPercent} size="sm" color="blue" />
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{answeredCount} answered</span>
            <span>{totalQuestions - answeredCount} remaining</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <Card className="mb-4">
        <div className="flex items-center space-x-2 mb-4">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {currentQuestion.difficulty}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {currentQuestion.questionType === 'multiple_choice' ? 'Multiple Choice' :
             currentQuestion.questionType === 'short_answer' ? 'Short Answer' : 'Fill in Blank'}
          </span>
        </div>

        <p className="text-lg text-gray-900 mb-6">{currentQuestion.questionText}</p>

        {/* Answer Input */}
        {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options ? (
          <div className="space-y-2">
            {currentQuestion.options.map((option, idx) => {
              const letter = option.charAt(0);
              const isSelected = currentAnswer.toLowerCase() === letter.toLowerCase();

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentAnswer(letter)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-sm font-medium ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {letter}
                  </span>
                  {option.slice(2).trim()}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            {currentQuestion.questionType === 'short_answer' ? (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            ) : (
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Fill in the blank..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        )}
      </Card>

      {/* Immediate Feedback */}
      {showFeedback && currentFeedback && (
        <Card className={`mb-4 border-2 ${currentFeedback.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              currentFeedback.isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {currentFeedback.isCorrect ? (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold ${currentFeedback.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {currentFeedback.isCorrect ? 'Richtig!' : 'Falsch'}
              </h4>
              <p className="text-sm mt-1">
                <span className="font-medium">Richtige Antwort:</span> {currentFeedback.correctAnswer}
              </p>
              {currentFeedback.explanation && (
                <p className="text-sm mt-2 text-gray-700">
                  <span className="font-medium">Erklärung:</span> {currentFeedback.explanation}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex items-center space-x-1">
          {exam.questions.map((_, idx) => {
            const hasAnswer = answers.has(exam.questions[idx].id!) ||
              (idx === currentIndex && currentAnswer);

            return (
              <button
                key={idx}
                onClick={() => goToQuestion(idx)}
                className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white'
                    : hasAnswer
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {showFeedback ? (
          <Button onClick={handleNext}>
            {currentIndex === totalQuestions - 1 ? 'Ergebnis anzeigen' : 'Weiter'}
          </Button>
        ) : currentIndex === totalQuestions - 1 ? (
          <Button onClick={() => exam.config.showImmediateFeedback && currentAnswer ? saveCurrentAnswer(true) : setShowConfirmEnd(true)}>
            {exam.config.showImmediateFeedback && currentAnswer ? 'Prüfen' : 'Finish Exam'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {exam.config.showImmediateFeedback && currentAnswer ? 'Prüfen' : 'Next'}
          </Button>
        )}
      </div>

      {/* Confirm End Modal */}
      {showConfirmEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              End Exam?
            </h3>
            <p className="text-gray-600 mb-4">
              You have answered {answeredCount} of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="text-yellow-600">
                  {' '}{totalQuestions - answeredCount} questions will be marked as skipped.
                </span>
              )}
            </p>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSubmit}
                loading={submitting}
                className="flex-1"
              >
                Submit Exam
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowConfirmEnd(false)}
                disabled={submitting}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
            <button
              onClick={onCancel}
              disabled={submitting}
              className="w-full mt-3 text-sm text-red-600 hover:text-red-800"
            >
              Cancel and discard answers
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
