import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        aria-label="Hilfe"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Hilfe & Anleitung</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Import Questions - Primary Section */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Fragen importieren (Schnellstart)
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Du hast eine JSON-Datei mit Fragen erhalten? So importierst du sie:
            </p>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">1</span>
                <span>Klicke auf <strong>"Fragenbank"</strong> in der Navigation oben</span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">2</span>
                <span>Wähle den Tab <strong>"Verwalten"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">3</span>
                <span>Klicke auf <strong>"Import JSON"</strong> und wähle deine Datei</span>
              </li>
            </ol>
            <p className="text-xs text-blue-600 mt-3">
              Nach dem Import kannst du unter "Prüfung" sofort mit dem Üben beginnen!
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Eigene Fragen erstellen
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">1</span>
                <span><strong>Bibliothek:</strong> Lade deine Kurs-PDFs oder Bilder hoch. Text wird automatisch extrahiert.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">2</span>
                <span><strong>Fragen:</strong> Füge deinen Claude API-Schlüssel hinzu, wähle Dateien und generiere Fragen mit KI.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">3</span>
                <span><strong>Prüfung:</strong> Konfiguriere und starte Übungsprüfungen, um dein Wissen zu testen.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">4</span>
                <span><strong>Statistik:</strong> Verfolge deinen Fortschritt und identifiziere Verbesserungsbereiche.</span>
              </li>
            </ol>
          </section>

          {/* Subjects */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Unterstützte Fächer
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="px-3 py-2 bg-blue-50 rounded text-blue-800">PR (Public Relations)</div>
              <div className="px-3 py-2 bg-purple-50 rounded text-purple-800">Audiovisueller Journalismus</div>
              <div className="px-3 py-2 bg-green-50 rounded text-green-800">Publizistik</div>
              <div className="px-3 py-2 bg-orange-50 rounded text-orange-800">Journalismus</div>
            </div>
          </section>

          {/* File Types */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Unterstützte Dateitypen
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>PDF:</strong> Text wird direkt aus dem Dokument extrahiert</li>
              <li><strong>PNG/JPG:</strong> OCR mit Deutsch + Englisch Unterstützung</li>
            </ul>
          </section>

          {/* Question Types */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Fragetypen
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Multiple Choice:</strong> 4 Optionen, eine richtige Antwort</li>
              <li><strong>Kurzantwort:</strong> 1-3 Sätze Antwort</li>
              <li><strong>Lückentext:</strong> Ein Wort oder eine Phrase</li>
            </ul>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Tipps
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Nutzen Sie "Ordner importieren" um ganze Kursordner hochzuladen</li>
              <li>Überprüfen Sie falsche Antworten nach jeder Prüfung</li>
              <li>Konzentrieren Sie sich auf Fächer mit niedrigeren Punktzahlen</li>
              <li>Generieren Sie Fragen mit gemischter Schwierigkeit für besseres Üben</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Daten & Datenschutz
            </h3>
            <p className="text-sm text-gray-600">
              Alle deine Daten werden lokal in deinem Browser gespeichert (IndexedDB).
              Deine Dateien und Fragen werden niemals auf einen Server hochgeladen.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Tipp:</strong> Nutze "Export JSON" um deine Fragen zu sichern oder mit anderen zu teilen!
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Verstanden!
          </Button>
        </div>
      </Card>
    </div>
  );
}
