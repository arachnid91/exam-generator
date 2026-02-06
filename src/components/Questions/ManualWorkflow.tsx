import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SUBJECTS, SUBJECT_COLORS } from '../../db/models';
import type { Subject, UploadedFile, Question } from '../../db/models';

interface ManualWorkflowProps {
  files: UploadedFile[];
  onQuestionsImported: (questions: Omit<Question, 'id'>[]) => Promise<void>;
}

export function ManualWorkflow({ files, onQuestionsImported }: ManualWorkflowProps) {
  const [activeStep, setActiveStep] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importSubject, setImportSubject] = useState<Subject>('PR');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Group files by subject
  const filesBySubject = SUBJECTS.reduce((acc, subject) => {
    acc[subject] = files.filter(f => f.subject === subject && f.processingStatus === 'completed');
    return acc;
  }, {} as Record<Subject, UploadedFile[]>);

  const generateExportContent = (subject: Subject): string => {
    const subjectFiles = filesBySubject[subject];
    if (subjectFiles.length === 0) return '';

    let content = `=== ${subject} ===\n\n`;
    content += `Anzahl Dateien: ${subjectFiles.length}\n`;
    content += `─────────────────────────────────────\n\n`;

    subjectFiles.forEach((file, index) => {
      content += `--- Datei ${index + 1}: ${file.name} ---\n\n`;
      content += file.extractedText || '[Kein Text extrahiert]';
      content += '\n\n';
    });

    return content;
  };

  const generateFullExport = (): string => {
    let content = `PRÜFUNGSGENERATOR - EXPORTIERTE KURSMATERIALIEN
================================================
Exportiert am: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}

`;

    SUBJECTS.forEach(subject => {
      const subjectContent = generateExportContent(subject);
      if (subjectContent) {
        content += subjectContent + '\n\n';
      }
    });

    return content;
  };

  const generatePromptTemplate = (): string => {
    return `ANLEITUNG ZUR FRAGENGENERIERUNG MIT CLAUDE.AI
==============================================

1. Öffne Claude.ai (https://claude.ai)
2. Kopiere den folgenden Prompt und füge ihn ein
3. Ersetze [FACH] mit dem Fach (PR, Audio-Visualism, Publicity, oder Journalism)
4. Füge den extrahierten Text aus der entsprechenden Sektion ein
5. Kopiere die JSON-Ausgabe und importiere sie in die App

─────────────────────────────────────
PROMPT VORLAGE (kopieren und anpassen):
─────────────────────────────────────

Du bist ein Universitätsprofessor, der Prüfungsfragen auf Deutsch erstellt.

Generiere Prüfungsfragen basierend auf dem folgenden Kursmaterial zum Thema [FACH].

ANFORDERUNGEN:
- Alle Fragen auf Deutsch
- Englische Fachbegriffe in Anführungszeichen behalten (z.B. "Public Relations")
- Schwierigkeitsverteilung: ca. 40% leicht, 40% mittel, 20% schwer
- Fragetypen: hauptsächlich Multiple Choice (4 Optionen), einige Kurzantwort und Lückentext
- Qualität vor Quantität - nur sinnvolle, prüfungsrelevante Fragen

FRAGETYPEN:
1. multiple_choice: 4 Optionen (A, B, C, D), eine richtige Antwort
2. short_answer: Kurzantwort (1-3 Sätze)
3. fill_in: Lückentext (ein Wort oder kurze Phrase)

TAXONOMIE:
- recall: Faktenwissen (Definitionen, Namen, Daten)
- conceptual: Konzeptverständnis (Theorien erklären, vergleichen)
- application: Anwendung (Szenarien analysieren, Konzepte anwenden)

AUSGABE als JSON-Array:
[
  {
    "questionText": "Frage auf Deutsch...",
    "questionType": "multiple_choice",
    "difficulty": "easy|medium|hard",
    "taxonomyType": "recall|conceptual|application",
    "correctAnswer": "A",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "explanation": "Kurze Erklärung der richtigen Antwort..."
  }
]

KURSMATERIAL:
[Hier den extrahierten Text einfügen]

─────────────────────────────────────
`;
  };

  const handleExport = (subject?: Subject) => {
    let content: string;
    let filename: string;

    if (subject) {
      content = generateExportContent(subject);
      filename = `kursmaterial_${subject.toLowerCase().replace('-', '_')}.txt`;
    } else {
      content = generateFullExport();
      filename = 'kursmaterial_alle_faecher.txt';
    }

    // Add prompt template at the end
    content += '\n\n' + generatePromptTemplate();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    setError(null);
    setSuccess(null);
    setImporting(true);

    try {
      // Try to parse the JSON
      let questions: unknown[];

      // Try to extract JSON from the text (in case there's extra text around it)
      const jsonMatch = importText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Kein gültiges JSON-Array gefunden. Die Ausgabe muss mit [ beginnen und mit ] enden.');
      }

      try {
        questions = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error('JSON-Parsing fehlgeschlagen. Bitte überprüfen Sie das Format.');
      }

      if (!Array.isArray(questions)) {
        throw new Error('Die Eingabe muss ein JSON-Array sein.');
      }

      if (questions.length === 0) {
        throw new Error('Keine Fragen im JSON gefunden.');
      }

      // Validate and transform questions
      const validatedQuestions: Omit<Question, 'id'>[] = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i] as Record<string, unknown>;

        // Validate required fields
        if (!q.questionText || typeof q.questionText !== 'string') {
          throw new Error(`Frage ${i + 1}: "questionText" fehlt oder ist ungültig`);
        }
        if (!q.questionType || !['multiple_choice', 'short_answer', 'fill_in'].includes(q.questionType as string)) {
          throw new Error(`Frage ${i + 1}: "questionType" muss "multiple_choice", "short_answer" oder "fill_in" sein`);
        }
        if (!q.difficulty || !['easy', 'medium', 'hard'].includes(q.difficulty as string)) {
          throw new Error(`Frage ${i + 1}: "difficulty" muss "easy", "medium" oder "hard" sein`);
        }
        if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
          throw new Error(`Frage ${i + 1}: "correctAnswer" fehlt oder ist ungültig`);
        }

        validatedQuestions.push({
          subject: importSubject,
          questionText: q.questionText as string,
          questionType: q.questionType as 'multiple_choice' | 'short_answer' | 'fill_in',
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          taxonomyType: (q.taxonomyType as 'recall' | 'conceptual' | 'application') || 'recall',
          correctAnswer: q.correctAnswer as string,
          options: q.questionType === 'multiple_choice' ? (q.options as string[] || []) : undefined,
          explanation: (q.explanation as string) || '',
          sourceFileId: 0, // Not linked to specific file in manual import
          timesShown: 0,
          timesCorrect: 0,
          timesIncorrect: 0
        });
      }

      await onQuestionsImported(validatedQuestions);
      setSuccess(`${validatedQuestions.length} Fragen erfolgreich importiert für ${importSubject}!`);
      setImportText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    } finally {
      setImporting(false);
    }
  };

  const totalFiles = files.filter(f => f.processingStatus === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Step Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveStep('export')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeStep === 'export'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 mr-2 text-sm">1</span>
          Exportieren
        </button>
        <button
          onClick={() => setActiveStep('import')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeStep === 'import'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 mr-2 text-sm">2</span>
          Importieren
        </button>
      </div>

      {activeStep === 'export' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Kursmaterial exportieren
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Exportieren Sie den extrahierten Text Ihrer Dateien, um ihn in Claude.ai für die Fragengenerierung zu verwenden.
            Die Exportdatei enthält auch eine Prompt-Vorlage.
          </p>

          {totalFiles === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Keine verarbeiteten Dateien vorhanden.</p>
              <p className="text-sm mt-1">Laden Sie zuerst Dateien in der Bibliothek hoch.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {SUBJECTS.map(subject => {
                  const count = filesBySubject[subject].length;
                  return (
                    <button
                      key={subject}
                      onClick={() => handleExport(subject)}
                      disabled={count === 0}
                      className={`p-4 rounded-lg border-2 transition-colors text-left ${
                        count > 0
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[subject]}`}>
                        {subject}
                      </span>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">Dateien</div>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <Button onClick={() => handleExport()} className="w-full">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Alle Fächer exportieren ({totalFiles} Dateien)
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Nächste Schritte:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Exportierte Datei öffnen</li>
              <li>Claude.ai öffnen und den Prompt mit dem Kursmaterial einfügen</li>
              <li>JSON-Ausgabe von Claude kopieren</li>
              <li>Hier im Tab "Importieren" einfügen</li>
            </ol>
          </div>
        </Card>
      )}

      {activeStep === 'import' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fragen importieren
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Fügen Sie die JSON-Ausgabe von Claude.ai ein, um die generierten Fragen zu importieren.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Fehler:</strong> {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fach auswählen
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => setImportSubject(subject)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    importSubject === subject
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON von Claude.ai einfügen
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"questionText": "...", "questionType": "multiple_choice", ...}]'
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button
            onClick={handleImport}
            loading={importing}
            disabled={!importText.trim()}
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Fragen importieren
          </Button>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Erwartetes JSON-Format:</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`[
  {
    "questionText": "Was bedeutet 'PR'?",
    "questionType": "multiple_choice",
    "difficulty": "easy",
    "taxonomyType": "recall",
    "correctAnswer": "A",
    "options": [
      "A) Public Relations",
      "B) Private Relations",
      "C) Press Release",
      "D) Public Report"
    ],
    "explanation": "PR steht für..."
  }
]`}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
