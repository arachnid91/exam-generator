import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { CoverageOverview } from '../components/Coverage/CoverageOverview';
import { getQuestionStats } from '../db/database';
import { getOverallStats } from '../services/examService';

interface HomeProps {
  stats: Record<string, { total: number; processed: number; pending: number }>;
}

interface ExamStats {
  totalExams: number;
  averageScore: number;
}

export function Home({ stats }: HomeProps) {
  const [questionStats, setQuestionStats] = useState<Record<string, { total: number }>>({});
  const [examStats, setExamStats] = useState<ExamStats>({ totalExams: 0, averageScore: 0 });

  useEffect(() => {
    getQuestionStats().then(setQuestionStats);
    getOverallStats().then(data => {
      setExamStats({
        totalExams: data.totalExams,
        averageScore: data.averageScore
      });
    });
  }, []);

  const totalFiles = Object.values(stats).reduce((acc, s) => acc + s.total, 0);
  const totalProcessed = Object.values(stats).reduce((acc, s) => acc + s.processed, 0);
  const totalQuestions = Object.values(questionStats).reduce((acc, s) => acc + s.total, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Exam Generator</h1>
        <p className="mt-2 text-gray-600">
          Upload your course materials, generate questions, and practice for your exams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="text-sm text-gray-500">Total Files</div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{totalFiles}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Processed</div>
          <div className="mt-1 text-3xl font-bold text-green-600">{totalProcessed}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Questions Generated</div>
          <div className="mt-1 text-3xl font-bold text-blue-600">{totalQuestions}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Exams Taken</div>
          <div className="mt-1 text-3xl font-bold text-purple-600">{examStats.totalExams}</div>
          {examStats.totalExams > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Avg: {examStats.averageScore}%
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                totalFiles > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {totalFiles > 0 ? '✓' : '1'}
              </span>
              <span className={totalFiles > 0 ? 'text-green-700' : ''}>
                Upload your course PDFs and images in the Library tab
              </span>
            </li>
            <li className="flex items-start">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                totalProcessed > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {totalProcessed > 0 ? '✓' : '2'}
              </span>
              <span className={totalProcessed > 0 ? 'text-green-700' : ''}>
                Wait for text extraction to complete
              </span>
            </li>
            <li className="flex items-start">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                totalQuestions > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {totalQuestions > 0 ? '✓' : '3'}
              </span>
              <span className={totalQuestions > 0 ? 'text-green-700' : ''}>
                Generate questions using Claude AI in the Questions tab
              </span>
            </li>
            <li className="flex items-start">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 ${
                examStats.totalExams > 0 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {examStats.totalExams > 0 ? '✓' : '4'}
              </span>
              <span className={examStats.totalExams > 0 ? 'text-green-700' : ''}>
                Take practice exams in the Take Exam tab
              </span>
            </li>
          </ol>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subject Overview</h2>
          {Object.keys(stats).length === 0 ? (
            <p className="text-sm text-gray-500">
              No files uploaded yet. Go to the Library to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats).map(([subject, s]) => (
                <div key={subject} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{subject}</span>
                    {questionStats[subject] && (
                      <span className="ml-2 text-xs text-blue-600">
                        {questionStats[subject].total} questions
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {s.processed}/{s.total} files
                    </span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${s.total > 0 ? (s.processed / s.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Course Coverage Overview */}
      <div className="mt-8">
        <CoverageOverview questionStats={questionStats} />
      </div>
    </div>
  );
}
