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
          {/* Getting Started */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
              Erste Schritte
            </h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">1</span>
                <span><strong>Bibliothek:</strong> Laden Sie Ihre Kurs-PDFs oder Bilder hoch. Text wird automatisch extrahiert.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">2</span>
                <span><strong>Fragen:</strong> Fügen Sie Ihren Claude API-Schlüssel hinzu, wählen Sie Dateien und generieren Sie Fragen mit KI.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">3</span>
                <span><strong>Prüfung:</strong> Konfigurieren und starten Sie Übungsprüfungen, um Ihr Wissen zu testen.</span>
              </li>
              <li className="flex">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 flex-shrink-0">4</span>
                <span><strong>Statistik:</strong> Verfolgen Sie Ihren Fortschritt und identifizieren Sie Verbesserungsbereiche.</span>
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
              Alle Ihre Daten werden lokal in Ihrem Browser mit IndexedDB gespeichert.
              Ihre Dateien und Fragen werden niemals auf einen Server hochgeladen, außer bei
              der Fragegenerierung über die Claude API (nur Text wird gesendet, keine Dateien).
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
