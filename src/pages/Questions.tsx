import { useState } from 'react';
import { ManualWorkflow } from '../components/Questions/ManualWorkflow';
import { QuestionList } from '../components/Questions/QuestionList';
import { useQuestions } from '../hooks/useQuestions';
import { useFiles } from '../hooks/useFiles';
import { SUBJECTS, SUBJECT_COLORS } from '../db/models';

type Tab = 'generate' | 'manage';

export function Questions() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const { questions, loading, stats, deleteQuestion, deleteAllQuestions, updateQuestion, addGeneratedQuestions } = useQuestions();
  const { files } = useFiles();

  const handleQuestionsImported = async (newQuestions: Parameters<typeof addGeneratedQuestions>[0]) => {
    await addGeneratedQuestions(newQuestions);
  };

  const totalQuestions = Object.values(stats).reduce((acc, s) => acc + s.total, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fragenbank</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generieren und verwalten Sie Prüfungsfragen aus Ihren Kursmaterialien.
        </p>
      </div>

      {/* Stats Summary */}
      {totalQuestions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {SUBJECTS.map(subject => {
            const subjectStats = stats[subject];
            if (!subjectStats) return null;

            return (
              <div key={subject} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[subject]}`}>
                    {subject}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">{subjectStats.total}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="text-green-600">{subjectStats.byDifficulty.easy} leicht</span>
                  <span className="text-yellow-600">{subjectStats.byDifficulty.medium} mittel</span>
                  <span className="text-red-600">{subjectStats.byDifficulty.hard} schwer</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Generieren
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Verwalten ({totalQuestions})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <ManualWorkflow
          files={files}
          onQuestionsImported={handleQuestionsImported}
        />
      )}

      {activeTab === 'manage' && (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="ml-2 text-gray-600">Fragen werden geladen...</span>
          </div>
        ) : (
          <QuestionList
            questions={questions}
            onDelete={deleteQuestion}
            onUpdate={updateQuestion}
            onImport={addGeneratedQuestions}
            onDeleteAll={deleteAllQuestions}
          />
        )
      )}
    </div>
  );
}
