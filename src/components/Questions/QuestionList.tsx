import { useState, useMemo, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Question, Subject, Difficulty, QuestionType } from '../../db/models';
import { SUBJECTS, SUBJECT_COLORS } from '../../db/models';

// Export questions to JSON file
const exportQuestionsToJSON = (questions: Question[]) => {
  const exportData = questions.map(q => ({
    subject: q.subject,
    questionText: q.questionText,
    questionType: q.questionType,
    difficulty: q.difficulty,
    taxonomyType: q.taxonomyType,
    correctAnswer: q.correctAnswer,
    options: q.options,
    explanation: q.explanation
  }));

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `exam-questions-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

interface QuestionListProps {
  questions: Question[];
  onDelete: (id: number) => Promise<void>;
  onUpdate: (id: number, updates: Partial<Question>) => Promise<void>;
  onImport?: (questions: Omit<Question, 'id'>[]) => Promise<number[]>;
  onDeleteAll?: () => Promise<void>;
}

interface Filters {
  subject: Subject | 'all';
  difficulty: Difficulty | 'all';
  questionType: QuestionType | 'all';
  search: string;
}

export function QuestionList({ questions, onDelete, onUpdate, onImport, onDeleteAll }: QuestionListProps) {
  const [filters, setFilters] = useState<Filters>({
    subject: 'all',
    difficulty: 'all',
    questionType: 'all',
    search: ''
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Question>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAll = async () => {
    if (!onDeleteAll) return;
    if (!confirm(`Alle ${questions.length} Fragen wirklich löschen?`)) return;

    setDeletingAll(true);
    try {
      await onDeleteAll();
    } finally {
      setDeletingAll(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const questionsArray = Array.isArray(data) ? data : [data];
      await onImport(questionsArray);
      alert(`${questionsArray.length} Fragen erfolgreich importiert!`);
    } catch (err) {
      alert('Fehler beim Import: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (filters.subject !== 'all' && q.subject !== filters.subject) return false;
      if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
      if (filters.questionType !== 'all' && q.questionType !== filters.questionType) return false;
      if (filters.search && !q.questionText.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [questions, filters]);

  const handleEdit = (question: Question) => {
    setEditingId(question.id!);
    setEditForm({
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      options: question.options
    });
  };

  const handleSave = async () => {
    if (editingId && editForm) {
      await onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getDifficultyBadge = (difficulty: Difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      hard: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[difficulty]}`}>
        {difficulty}
      </span>
    );
  };

  const getTypeBadge = (type: QuestionType) => {
    const labels = {
      multiple_choice: 'MC',
      short_answer: 'Short',
      fill_in: 'Fill'
    };
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {labels[type]}
      </span>
    );
  };

  if (questions.length === 0) {
    return (
      <div>
        {/* Import Bar - always show so user can import questions */}
        <Card className="mb-4" padding="sm">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="text-sm text-gray-600">
              Keine Fragen in der Datenbank
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleImportClick}
                loading={importing}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import JSON
              </Button>
            </div>
          </div>
        </Card>

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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Generate questions from your course materials or import from JSON.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Export/Import Bar */}
      <Card className="mb-4" padding="sm">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>{questions.length}</strong> Fragen in der Datenbank
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleImportClick}
              loading={importing}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import JSON
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportQuestionsToJSON(questions)}
              disabled={questions.length === 0}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export JSON
            </Button>
            {onDeleteAll && (
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteAll}
                loading={deletingAll}
                disabled={questions.length === 0}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Alle löschen
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="mb-4" padding="sm">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search questions..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filters.subject}
            onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value as Subject | 'all' }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Subjects</option>
            {SUBJECTS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as Difficulty | 'all' }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filters.questionType}
            onChange={(e) => setFilters(prev => ({ ...prev, questionType: e.target.value as QuestionType | 'all' }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="short_answer">Short Answer</option>
            <option value="fill_in">Fill in Blank</option>
          </select>

          <span className="text-sm text-gray-500">
            {filteredQuestions.length} of {questions.length}
          </span>
        </div>
      </Card>

      {/* Question List */}
      <div className="space-y-3">
        {filteredQuestions.map((question) => (
          <Card key={question.id} padding="sm">
            {editingId === question.id ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Question</label>
                  <textarea
                    value={editForm.questionText || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, questionText: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={3}
                  />
                </div>

                {question.questionType === 'multiple_choice' && editForm.options && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Options</label>
                    {editForm.options.map((opt, idx) => (
                      <input
                        key={idx}
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...(editForm.options || [])];
                          newOptions[idx] = e.target.value;
                          setEditForm(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm mb-1"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>
                  <input
                    value={editForm.correctAnswer || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Explanation</label>
                  <textarea
                    value={editForm.explanation || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, explanation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditForm({}); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[question.subject]}`}>
                        {question.subject}
                      </span>
                      {getDifficultyBadge(question.difficulty)}
                      {getTypeBadge(question.questionType)}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {question.taxonomyType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{question.questionText}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === question.id ? null : question.id!)}
                    >
                      {expandedId === question.id ? 'Less' : 'More'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === question.id}
                      onClick={() => handleDelete(question.id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === question.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    {question.options && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1">Options</h4>
                        <ul className="space-y-1">
                          {question.options.map((opt, idx) => (
                            <li
                              key={idx}
                              className={`text-sm px-2 py-1 rounded ${
                                opt.includes(question.correctAnswer) || question.correctAnswer.startsWith(opt.charAt(0))
                                  ? 'bg-green-50 text-green-800'
                                  : 'text-gray-700'
                              }`}
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Correct Answer</h4>
                      <p className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                        {question.correctAnswer}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Explanation</h4>
                      <p className="text-sm text-gray-600">{question.explanation}</p>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Shown: {question.timesShown}</span>
                      <span>Correct: {question.timesCorrect}</span>
                      <span>Incorrect: {question.timesIncorrect}</span>
                      {question.timesShown > 0 && (
                        <span>
                          Success rate: {Math.round((question.timesCorrect / question.timesShown) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
