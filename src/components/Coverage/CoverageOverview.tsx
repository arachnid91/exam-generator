import { useState } from 'react';
import { Card } from '../ui/Card';

interface LectureInfo {
  id: string;
  topic: string;
  covered: boolean;
  note?: string;
}

interface SubjectCoverage {
  name: string;
  displayName: string;
  lectures: LectureInfo[];
  questionCount: number;
}

const coverageData: SubjectCoverage[] = [
  {
    name: 'PR',
    displayName: 'Public Relations',
    questionCount: 52,
    lectures: [
      { id: '01', topic: 'Definition und Abgrenzung (Grunig/Hunt)', covered: true },
      { id: '02', topic: 'Image, Reputation und Vertrauen', covered: true },
      { id: '03', topic: 'Geschichte & Berufsfeld, PESO-Modell', covered: true },
      { id: '04', topic: 'CSR (Carroll-Pyramide, Greenwashing)', covered: true },
      { id: '05', topic: 'Bezugsgruppen I - Journalismus (Determinationsthese)', covered: true },
      { id: '06', topic: 'Bezugsgruppen II - Mitarbeitende (Interne Kom.)', covered: true },
      { id: '07', topic: 'Bezugsgruppen III - Politik (Public Affairs)', covered: true },
      { id: '08', topic: 'Persuasion I (ELM, Theory of Planned Behavior)', covered: true },
      { id: '09', topic: 'Persuasion II (Heuristiken, Reziprozität)', covered: true },
      { id: '10', topic: 'Persuasion III (Konformität, Framing)', covered: true },
    ]
  },
  {
    name: 'Journalism',
    displayName: 'Einführung in den Journalismus',
    questionCount: 77,
    lectures: [
      { id: '01', topic: 'Einführung - Was ist Journalismus?', covered: true },
      { id: '02', topic: 'Funktionen, normative Grundlagen', covered: true },
      { id: '03', topic: 'Rechtlicher Rahmen (GG Art. 5, Spiegel-Affäre)', covered: true },
      { id: '04', topic: 'Wie Redaktionen arbeiten', covered: false, note: 'Gast-Vorlesung' },
      { id: '05', topic: 'Journalistische Sprache, Darstellungsformen', covered: true },
      { id: '06', topic: 'Medienlandschaft (Duales System)', covered: true },
      { id: '07', topic: 'Fake News, Medienkritik, Objektivität', covered: true },
      { id: '08', topic: 'Recherche, investigativer Journalismus', covered: true },
      { id: '09', topic: 'Ethik und Qualität I', covered: true },
      { id: '10', topic: 'Ethik und Qualität II', covered: true },
      { id: '11', topic: 'Ethik und Qualität III', covered: true },
      { id: '12', topic: 'Ethik (Werther-Effekt, Barschel)', covered: true },
    ]
  },
  {
    name: 'Publicity',
    displayName: 'Einführung in die Publizistikwissenschaft',
    questionCount: 74,
    lectures: [
      { id: '01', topic: 'Einführung (Lasswell-Formel)', covered: true },
      { id: '02', topic: 'Interpersonale Kommunikation', covered: true },
      { id: '03', topic: 'Massenkommunikation und Öffentlichkeit (Maletzke)', covered: true },
      { id: '04', topic: 'Fachgeschichte', covered: false, note: 'Online-Sitzung' },
      { id: '05', topic: 'Who? Kommunikator_innenforschung', covered: true },
      { id: '06', topic: 'Says what? Nachrichtenauswahl', covered: true },
      { id: '07', topic: 'In which channel I? Mediensystem (Hallin & Mancini)', covered: true },
      { id: '08', topic: 'In which channel II? Medienpolitik', covered: true },
      { id: '09', topic: 'In which channel III? Medienqualität', covered: true },
      { id: '10', topic: 'To whom I? Mediennutzung I', covered: true },
      { id: '11', topic: 'To whom II? Mediennutzung II (Limited Capacity, PSI)', covered: true },
      { id: '12', topic: 'With what effect? Medienwirkung (Agenda Setting)', covered: true },
    ]
  },
  {
    name: 'Audio-Visualism',
    displayName: 'Audiovisueller Journalismus',
    questionCount: 50,
    lectures: [
      { id: '01', topic: 'Gestaltung I - Bildgestaltung', covered: true },
      { id: '02', topic: 'Montage', covered: true },
      { id: '03', topic: 'Sprache und Bild ON', covered: true },
      { id: '04', topic: 'Sprache und Bild OFF', covered: true },
      { id: '05', topic: 'Überblick Formate', covered: true },
      { id: '06', topic: 'Stoffentwicklung', covered: true },
      { id: '07', topic: 'Berichten & Erzählen', covered: true },
      { id: '08', topic: 'Ethik-Recht', covered: true },
      { id: '09', topic: 'Klausurvorbereitung', covered: false, note: 'Keine Folien' },
      { id: '10', topic: 'Nutzung und Innovation', covered: true },
    ]
  }
];

interface CoverageOverviewProps {
  questionStats: Record<string, { total: number }>;
}

export function CoverageOverview({ questionStats }: CoverageOverviewProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const getSubjectStats = (subject: SubjectCoverage) => {
    const coveredLectures = subject.lectures.filter(l => l.covered).length;
    const totalLectures = subject.lectures.length;
    const percentage = Math.round((coveredLectures / totalLectures) * 100);
    const actualQuestions = questionStats[subject.name]?.total || subject.questionCount;
    return { coveredLectures, totalLectures, percentage, actualQuestions };
  };

  const totalStats = coverageData.reduce(
    (acc, subject) => {
      const stats = getSubjectStats(subject);
      return {
        lectures: acc.lectures + stats.totalLectures,
        covered: acc.covered + stats.coveredLectures,
        questions: acc.questions + stats.actualQuestions,
      };
    },
    { lectures: 0, covered: 0, questions: 0 }
  );

  const overallPercentage = Math.round((totalStats.covered / totalStats.lectures) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Course Coverage Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {totalStats.covered}/{totalStats.lectures} Vorlesungen
          </span>
          <span className={`px-2 py-1 text-xs font-bold rounded ${
            overallPercentage >= 90 ? 'bg-green-100 text-green-700' :
            overallPercentage >= 70 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {overallPercentage}%
          </span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Gesamtstatistik</span>
          <span className="text-blue-900 font-bold">{totalStats.questions} Fragen</span>
        </div>
        <div className="mt-2 w-full h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {coverageData.map((subject) => {
          const stats = getSubjectStats(subject);
          const isExpanded = expandedSubject === subject.name;

          return (
            <div key={subject.name} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject.name)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    stats.percentage === 100 ? 'bg-green-500' :
                    stats.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="text-left">
                    <span className="font-medium text-gray-900">{subject.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{subject.displayName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-600 font-medium">
                    {stats.actualQuestions} Fragen
                  </span>
                  <span className="text-sm text-gray-500">
                    {stats.coveredLectures}/{stats.totalLectures}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    stats.percentage === 100 ? 'bg-green-100 text-green-700' :
                    stats.percentage >= 80 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {stats.percentage}%
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 py-3 bg-white border-t">
                  <div className="space-y-2">
                    {subject.lectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className={`flex items-center gap-3 py-1.5 px-2 rounded ${
                          lecture.covered ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                          lecture.covered
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {lecture.covered ? '✓' : '–'}
                        </span>
                        <span className="text-xs font-mono text-gray-400">
                          {subject.name === 'PR' ? 'Sitzung' : 'VL'} {lecture.id}
                        </span>
                        <span className={`text-sm flex-1 ${
                          lecture.covered ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {lecture.topic}
                        </span>
                        {lecture.note && (
                          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            {lecture.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>100% abgedeckt</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>80-99%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>&lt;80%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
