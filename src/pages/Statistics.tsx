import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getOverallStats, getExamHistory, getDetailedStats, deleteExamAttempt, formatTime } from '../services/examService';
import { exportStatisticsToPdf } from '../services/pdfExportService';
import { SUBJECTS, SUBJECT_COLORS } from '../db/models';
import type { ExamAttempt, Subject, DetailedStats } from '../db/models';

interface OverallStats {
  totalExams: number;
  averageScore: number;
  totalQuestionsSeen: number;
  bestSubject: string | null;
  weakestSubject: string | null;
  recentTrend: 'improving' | 'declining' | 'stable';
  subjectStats: Record<string, {
    exams: number;
    avgScore: number;
    bestScore: number;
    lastAttempt: Date | null;
  }>;
}

const CHART_COLORS = {
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
};

const DIFFICULTY_COLORS = {
  easy: CHART_COLORS.green,
  medium: CHART_COLORS.yellow,
  hard: CHART_COLORS.red
};

const TYPE_COLORS = {
  multiple_choice: CHART_COLORS.blue,
  short_answer: CHART_COLORS.purple,
  fill_in: CHART_COLORS.pink
};

export function Statistics() {
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [history, setHistory] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<Subject | 'all'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'history'>('overview');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, historyData, detailed] = await Promise.all([
        getOverallStats(),
        getExamHistory(),
        getDetailedStats()
      ]);
      setStats(statsData);
      setHistory(historyData);
      setDetailedStats(detailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteExamAttempt(id);
      await loadData();
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = filterSubject === 'all'
    ? history
    : history.filter(h => h.subject === filterSubject);

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
        <span className="ml-2 text-gray-600">Loading statistics...</span>
      </div>
    );
  }

  if (!stats || stats.totalExams === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your learning progress and performance.
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No exam data yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Take some practice exams to see your statistics here.
          </p>
        </Card>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (stats.recentTrend === 'improving') {
      return (
        <span className="inline-flex items-center text-green-600">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Improving
        </span>
      );
    }
    if (stats.recentTrend === 'declining') {
      return (
        <span className="inline-flex items-center text-red-600">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          Declining
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-gray-600">
        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        Stable
      </span>
    );
  };

  // Prepare chart data
  const difficultyChartData = detailedStats ? [
    { name: 'Easy', value: detailedStats.performanceByDifficulty.easy.percentage, total: detailedStats.performanceByDifficulty.easy.total },
    { name: 'Medium', value: detailedStats.performanceByDifficulty.medium.percentage, total: detailedStats.performanceByDifficulty.medium.total },
    { name: 'Hard', value: detailedStats.performanceByDifficulty.hard.percentage, total: detailedStats.performanceByDifficulty.hard.total }
  ] : [];

  const typeChartData = detailedStats ? [
    { name: 'Multiple Choice', value: detailedStats.performanceByType.multiple_choice.percentage, total: detailedStats.performanceByType.multiple_choice.total },
    { name: 'Short Answer', value: detailedStats.performanceByType.short_answer.percentage, total: detailedStats.performanceByType.short_answer.total },
    { name: 'Fill in Blank', value: detailedStats.performanceByType.fill_in.percentage, total: detailedStats.performanceByType.fill_in.total }
  ] : [];

  const subjectChartData = Object.entries(stats.subjectStats).map(([subject, data]) => ({
    name: subject,
    avgScore: data.avgScore,
    bestScore: data.bestScore,
    exams: data.exams
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your learning progress and performance.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => exportStatisticsToPdf(stats, history)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'breakdown'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Performance Breakdown
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exam History
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-500">Total Exams</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">{stats.totalExams}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Average Score</div>
              <div className={`mt-1 text-3xl font-bold ${
                stats.averageScore >= 70 ? 'text-green-600' :
                stats.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.averageScore}%
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Questions Seen</div>
              <div className="mt-1 text-3xl font-bold text-blue-600">{stats.totalQuestionsSeen}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-500">Trend</div>
              <div className="mt-1 text-lg font-medium">{getTrendIcon()}</div>
            </Card>
          </div>

          {/* Progress Over Time Chart */}
          {detailedStats && detailedStats.progressOverTime.length > 1 && (
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={detailedStats.progressOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={CHART_COLORS.blue}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.blue, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Subject Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
              {subjectChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        formatter={(value, name) => [
                          `${value}%`,
                          name === 'avgScore' ? 'Average' : 'Best'
                        ]}
                      />
                      <Bar dataKey="avgScore" fill={CHART_COLORS.blue} name="Average Score" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="bestScore" fill={CHART_COLORS.green} name="Best Score" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No subject data available</p>
              )}
            </Card>

            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
              <div className="space-y-4">
                {stats.bestSubject && (
                  <div className="flex items-start">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mr-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Best Subject</div>
                      <div className="text-sm text-gray-600">
                        {stats.bestSubject} with {stats.subjectStats[stats.bestSubject]?.avgScore}% average
                      </div>
                    </div>
                  </div>
                )}

                {stats.weakestSubject && stats.weakestSubject !== stats.bestSubject && (
                  <div className="flex items-start">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Needs Improvement</div>
                      <div className="text-sm text-gray-600">
                        {stats.weakestSubject} with {stats.subjectStats[stats.weakestSubject]?.avgScore}% average
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Recent Performance</div>
                    <div className="text-sm text-gray-600">
                      {stats.recentTrend === 'improving'
                        ? 'Your scores are improving! Keep it up!'
                        : stats.recentTrend === 'declining'
                          ? 'Your scores have been declining. Consider reviewing the material.'
                          : 'Your performance is consistent. Try challenging yourself with harder questions.'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'breakdown' && detailedStats && (
        <>
          {/* Performance by Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Difficulty</h3>
              {difficultyChartData.some(d => d.total > 0) ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={difficultyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                          formatter={(value, _name, props) => [
                            `${value}% (${(props.payload as { total: number }).total} questions)`,
                            'Accuracy'
                          ]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {difficultyChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={Object.values(DIFFICULTY_COLORS)[index]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {difficultyChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: Object.values(DIFFICULTY_COLORS)[index] }}
                          />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {item.value}% ({item.total} questions)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">No difficulty data available</p>
              )}
            </Card>

            {/* Performance by Question Type */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Question Type</h3>
              {typeChartData.some(d => d.total > 0) ? (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeChartData.filter(d => d.total > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          dataKey="total"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {typeChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={Object.values(TYPE_COLORS)[index]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                          formatter={(_value, _name, props) => [
                            `${(props.payload as { value: number }).value}% accuracy`,
                            (props.payload as { name: string }).name
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {typeChartData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <span
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: Object.values(TYPE_COLORS)[index] }}
                          />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {item.value}% ({item.total} questions)
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">No question type data available</p>
              )}
            </Card>
          </div>

          {/* Weekly Progress */}
          {detailedStats.weeklyProgress.length > 1 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={detailedStats.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#6B7280" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                      formatter={(value, name) => [
                        name === 'avgScore' ? `${value}%` : value,
                        name === 'avgScore' ? 'Average Score' : 'Exams Taken'
                      ]}
                    />
                    <Bar dataKey="avgScore" fill={CHART_COLORS.blue} name="Average Score" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-3">
              {detailedStats.performanceByDifficulty.hard.percentage < 50 && detailedStats.performanceByDifficulty.hard.total > 0 && (
                <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Focus on Hard Questions</p>
                    <p className="text-sm text-yellow-700">
                      Your accuracy on hard questions is {detailedStats.performanceByDifficulty.hard.percentage}%. Review challenging concepts and practice more difficult problems.
                    </p>
                  </div>
                </div>
              )}

              {detailedStats.performanceByType.short_answer.percentage < 50 && detailedStats.performanceByType.short_answer.total > 0 && (
                <div className="flex items-start p-3 bg-purple-50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Practice Short Answer Questions</p>
                    <p className="text-sm text-purple-700">
                      Your accuracy on short answer questions is {detailedStats.performanceByType.short_answer.percentage}%. Practice writing concise, complete answers.
                    </p>
                  </div>
                </div>
              )}

              {stats.weakestSubject && stats.subjectStats[stats.weakestSubject]?.avgScore < 60 && (
                <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Review {stats.weakestSubject}</p>
                    <p className="text-sm text-blue-700">
                      This is your weakest subject at {stats.subjectStats[stats.weakestSubject]?.avgScore}%. Consider reviewing the course materials.
                    </p>
                  </div>
                </div>
              )}

              {stats.averageScore >= 70 && (
                <div className="flex items-start p-3 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Great Progress!</p>
                    <p className="text-sm text-green-700">
                      Your overall average is {stats.averageScore}%. Keep up the good work and challenge yourself with harder questions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'history' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Exam History</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value as Subject | 'all')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No exam history for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Score</th>
                    <th className="pb-3 pr-4">Questions</th>
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.map(attempt => (
                    <tr key={attempt.id} className="text-sm">
                      <td className="py-3 pr-4 text-gray-600">
                        {new Date(attempt.date).toLocaleDateString()}{' '}
                        <span className="text-gray-400">
                          {new Date(attempt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[attempt.subject]}`}>
                          {attempt.subject}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-medium ${
                          attempt.score >= 70 ? 'text-green-600' :
                          attempt.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {attempt.questionIds.length}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatTime(attempt.timeTaken)}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={deletingId === attempt.id}
                          onClick={() => handleDelete(attempt.id!)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
