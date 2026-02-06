import { useState, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import type { UploadedFile, Subject, Difficulty, QuestionType, TaxonomyType, Question } from '../../db/models';
import { generateQuestions, questionToDbFormat, hasApiKey } from '../../services/claudeService';
import { SUBJECTS, SUBJECT_COLORS } from '../../db/models';

interface QuestionGeneratorProps {
  files: UploadedFile[];
  onQuestionsGenerated: (questions: Omit<Question, 'id'>[]) => Promise<void>;
}

interface GenerationConfig {
  selectedFiles: number[];
  count: number;
  difficulty: Difficulty | 'mixed';
  questionTypes: QuestionType[];
  taxonomyTypes: TaxonomyType[];
}

export function QuestionGenerator({ files, onQuestionsGenerated }: QuestionGeneratorProps) {
  const [config, setConfig] = useState<GenerationConfig>({
    selectedFiles: [],
    count: 10,
    difficulty: 'mixed',
    questionTypes: ['multiple_choice', 'short_answer'],
    taxonomyTypes: ['recall', 'conceptual', 'application']
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ count: number; subject: string } | null>(null);

  const processedFiles = files.filter(f => f.processingStatus === 'completed' && f.extractedText);

  // Group files by subject
  const filesBySubject = processedFiles.reduce((acc, f) => {
    if (!acc[f.subject]) acc[f.subject] = [];
    acc[f.subject].push(f);
    return acc;
  }, {} as Record<Subject, UploadedFile[]>);

  const toggleFile = useCallback((fileId: number) => {
    setConfig(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(fileId)
        ? prev.selectedFiles.filter(id => id !== fileId)
        : [...prev.selectedFiles, fileId]
    }));
  }, []);

  const selectAllInSubject = useCallback((subject: Subject) => {
    const subjectFileIds = filesBySubject[subject]?.map(f => f.id!) || [];
    const allSelected = subjectFileIds.every(id => config.selectedFiles.includes(id));

    setConfig(prev => ({
      ...prev,
      selectedFiles: allSelected
        ? prev.selectedFiles.filter(id => !subjectFileIds.includes(id))
        : [...new Set([...prev.selectedFiles, ...subjectFileIds])]
    }));
  }, [filesBySubject, config.selectedFiles]);

  const toggleQuestionType = useCallback((type: QuestionType) => {
    setConfig(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(type)
        ? prev.questionTypes.filter(t => t !== type)
        : [...prev.questionTypes, type]
    }));
  }, []);

  const toggleTaxonomyType = useCallback((type: TaxonomyType) => {
    setConfig(prev => ({
      ...prev,
      taxonomyTypes: prev.taxonomyTypes.includes(type)
        ? prev.taxonomyTypes.filter(t => t !== type)
        : [...prev.taxonomyTypes, type]
    }));
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!hasApiKey()) {
      setError('Please configure your Claude API key first.');
      return;
    }

    if (config.selectedFiles.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    if (config.questionTypes.length === 0) {
      setError('Please select at least one question type.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const selectedFileObjs = processedFiles.filter(f => config.selectedFiles.includes(f.id!));

      // Group by subject and generate for each
      const bySubject = selectedFileObjs.reduce((acc, f) => {
        if (!acc[f.subject]) acc[f.subject] = [];
        acc[f.subject].push(f);
        return acc;
      }, {} as Record<Subject, UploadedFile[]>);

      const allGeneratedQuestions: Omit<Question, 'id'>[] = [];
      const subjects = Object.keys(bySubject) as Subject[];
      let totalGenerated = 0;

      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        const subjectFiles = bySubject[subject];

        // Combine text from all files for this subject
        const combinedText = subjectFiles
          .map(f => `=== From: ${f.name} ===\n\n${f.extractedText}`)
          .join('\n\n---\n\n');

        // Calculate questions per subject
        const questionsPerSubject = Math.ceil(config.count / subjects.length);

        setProgressMessage(`Generating questions for ${subject}...`);

        const generated = await generateQuestions(
          combinedText,
          {
            subject,
            sourceFileId: subjectFiles[0].id!,
            count: questionsPerSubject,
            difficulty: config.difficulty,
            questionTypes: config.questionTypes,
            taxonomyTypes: config.taxonomyTypes
          },
          (p, msg) => {
            const baseProgress = (i / subjects.length) * 100;
            const subjectProgress = (p / 100) * (100 / subjects.length);
            setProgress(baseProgress + subjectProgress);
            setProgressMessage(msg);
          }
        );

        // Convert to database format
        const dbQuestions = generated.map(q =>
          questionToDbFormat(q, subject, subjectFiles[0].id!)
        );

        allGeneratedQuestions.push(...dbQuestions);
        totalGenerated += generated.length;
      }

      // Save all questions
      await onQuestionsGenerated(allGeneratedQuestions);

      setResult({
        count: totalGenerated,
        subject: subjects.length > 1 ? 'multiple subjects' : subjects[0]
      });
      setProgress(100);
      setProgressMessage('Complete!');

      // Reset selection
      setConfig(prev => ({ ...prev, selectedFiles: [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  }, [config, processedFiles, onQuestionsGenerated]);

  if (processedFiles.length === 0) {
    return (
      <Card className="text-center py-8">
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No processed files</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload and process some files in the Library first.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Questions</h2>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Source Files ({config.selectedFiles.length} selected)
        </label>
        <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {SUBJECTS.map(subject => {
            const subjectFiles = filesBySubject[subject];
            if (!subjectFiles?.length) return null;

            const allSelected = subjectFiles.every(f => config.selectedFiles.includes(f.id!));
            const someSelected = subjectFiles.some(f => config.selectedFiles.includes(f.id!));

            return (
              <div key={subject} className="space-y-1">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => selectAllInSubject(subject)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[subject]}`}>
                    {subject}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({subjectFiles.length} files)
                  </span>
                </div>
                <div className="ml-6 space-y-1">
                  {subjectFiles.map(file => (
                    <label key={file.id} className="flex items-center text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={config.selectedFiles.includes(file.id!)}
                        onChange={() => toggleFile(file.id!)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-2 truncate">{file.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generation Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Questions
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={config.count}
            onChange={(e) => setConfig(prev => ({ ...prev, count: parseInt(e.target.value) || 10 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={config.difficulty}
            onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as Difficulty | 'mixed' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="mixed">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Question Types */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Types
        </label>
        <div className="flex flex-wrap gap-2">
          {(['multiple_choice', 'short_answer', 'fill_in'] as QuestionType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleQuestionType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                config.questionTypes.includes(type)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'multiple_choice' ? 'Multiple Choice' :
               type === 'short_answer' ? 'Short Answer' : 'Fill in Blank'}
            </button>
          ))}
        </div>
      </div>

      {/* Taxonomy Types */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cognitive Levels
        </label>
        <div className="flex flex-wrap gap-2">
          {(['recall', 'conceptual', 'application'] as TaxonomyType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleTaxonomyType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                config.taxonomyTypes.includes(type)
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      {generating && (
        <div className="mb-4">
          <Progress value={progress} showLabel label={progressMessage} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Successfully generated {result.count} questions for {result.subject}!
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        loading={generating}
        disabled={generating || config.selectedFiles.length === 0 || config.questionTypes.length === 0}
        className="w-full"
        size="lg"
      >
        {generating ? 'Generating...' : `Generate ${config.count} Questions`}
      </Button>
    </Card>
  );
}
