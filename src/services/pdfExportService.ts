import { jsPDF } from 'jspdf';
import type { Question, Subject, ExamAttempt } from '../db/models';
import type { ExamResult } from './examService';

const SUBJECT_LABELS: Record<Subject, string> = {
  'PR': 'Public Relations',
  'Audio-Visualism': 'Audiovisueller Journalismus',
  'Publicity': 'Publizistik',
  'Journalism': 'Journalismus'
};

export function exportExamToPdf(
  questions: Question[],
  subject: Subject,
  includeAnswers: boolean = false
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Prüfungsbogen', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(SUBJECT_LABELS[subject], pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`${questions.length} Fragen`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;

  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Questions
  doc.setFontSize(11);

  questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = margin;
    }

    // Question number and difficulty
    doc.setFont('helvetica', 'bold');
    const diffLabel = question.difficulty === 'easy' ? 'Leicht' :
      question.difficulty === 'medium' ? 'Mittel' : 'Schwer';
    doc.text(`Frage ${index + 1} (${diffLabel})`, margin, yPos);
    yPos += 6;

    // Question text
    doc.setFont('helvetica', 'normal');
    const questionLines = doc.splitTextToSize(question.questionText, contentWidth);
    doc.text(questionLines, margin, yPos);
    yPos += questionLines.length * 5 + 3;

    // Options for multiple choice
    if (question.questionType === 'multiple_choice' && question.options) {
      question.options.forEach(option => {
        if (yPos > 270) {
          doc.addPage();
          yPos = margin;
        }
        const optionLines = doc.splitTextToSize(option, contentWidth - 10);
        doc.text(optionLines, margin + 5, yPos);
        yPos += optionLines.length * 5 + 2;
      });
    } else if (question.questionType === 'short_answer') {
      // Answer lines for short answer
      doc.setDrawColor(200);
      for (let i = 0; i < 3; i++) {
        doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
        yPos += 8;
      }
    } else {
      // Single line for fill in blank
      doc.text('Antwort: ___________________________', margin, yPos + 5);
      yPos += 10;
    }

    yPos += 8;
  });

  // Answer key on separate page
  if (includeAnswers) {
    doc.addPage();
    yPos = margin;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lösungen', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(10);

    questions.forEach((question, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}.`, margin, yPos);

      doc.setFont('helvetica', 'normal');
      const answerLines = doc.splitTextToSize(question.correctAnswer, contentWidth - 15);
      doc.text(answerLines, margin + 10, yPos);
      yPos += answerLines.length * 4 + 2;

      // Explanation
      if (question.explanation) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        const explainLines = doc.splitTextToSize(`Erklärung: ${question.explanation}`, contentWidth - 15);
        doc.text(explainLines, margin + 10, yPos);
        yPos += explainLines.length * 4 + 4;
        doc.setFontSize(10);
        doc.setTextColor(0);
      }
    });
  }

  // Save the PDF
  const filename = `Prüfung_${subject}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function exportResultsToPdf(
  result: ExamResult,
  subject: Subject
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Prüfungsergebnis', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(SUBJECT_LABELS[subject], pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Score summary box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');

  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  const scoreColor = result.score >= 70 ? [34, 197, 94] : result.score >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${result.score}%`, pageWidth / 2, yPos + 28, { align: 'center' });
  doc.setTextColor(0);
  yPos += 50;

  // Stats grid
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const stats = [
    ['Gesamt Fragen:', result.totalQuestions.toString()],
    ['Richtig:', result.correctAnswers.toString()],
    ['Falsch:', result.incorrectAnswers.toString()],
    ['Übersprungen:', result.skipped.toString()],
    ['Zeit:', formatTime(result.timeTaken)]
  ];

  stats.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 50, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Performance by difficulty
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Leistung nach Schwierigkeit', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const difficulties = [
    { name: 'Leicht', data: result.performanceByDifficulty.easy },
    { name: 'Mittel', data: result.performanceByDifficulty.medium },
    { name: 'Schwer', data: result.performanceByDifficulty.hard }
  ];

  difficulties.forEach(({ name, data }) => {
    if (data.total > 0) {
      const pct = Math.round((data.correct / data.total) * 100);
      doc.text(`${name}: ${data.correct}/${data.total} (${pct}%)`, margin, yPos);

      // Progress bar
      const barWidth = 60;
      const barHeight = 4;
      const barX = margin + 80;

      doc.setFillColor(230, 230, 230);
      doc.rect(barX, yPos - 3, barWidth, barHeight, 'F');

      const fillColor = pct >= 70 ? [34, 197, 94] : pct >= 50 ? [234, 179, 8] : [239, 68, 68];
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc.rect(barX, yPos - 3, barWidth * (pct / 100), barHeight, 'F');

      yPos += 8;
    }
  });

  yPos += 10;

  // Performance by type
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Leistung nach Fragetyp', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const types = [
    { name: 'Multiple Choice', data: result.performanceByType.multiple_choice },
    { name: 'Kurzantwort', data: result.performanceByType.short_answer },
    { name: 'Lückentext', data: result.performanceByType.fill_in }
  ];

  types.forEach(({ name, data }) => {
    if (data.total > 0) {
      const pct = Math.round((data.correct / data.total) * 100);
      doc.text(`${name}: ${data.correct}/${data.total} (${pct}%)`, margin, yPos);
      yPos += 7;
    }
  });

  yPos += 15;

  // Question review
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Fragenübersicht', margin, yPos);
  yPos += 10;

  doc.setFontSize(9);

  result.questionResults.forEach((qr, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = margin;
    }

    const icon = qr.isCorrect ? '✓' : qr.userAnswer ? '✗' : '—';
    const color = qr.isCorrect ? [34, 197, 94] : qr.userAnswer ? [239, 68, 68] : [156, 163, 175];

    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(icon, margin, yPos);

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    const questionPreview = qr.question.questionText.substring(0, 80) +
      (qr.question.questionText.length > 80 ? '...' : '');
    doc.text(`${index + 1}. ${questionPreview}`, margin + 8, yPos);
    yPos += 6;

    if (!qr.isCorrect) {
      doc.setTextColor(100);
      doc.text(`   Richtige Antwort: ${qr.question.correctAnswer.substring(0, 60)}`, margin + 8, yPos);
      doc.setTextColor(0);
      yPos += 6;
    }
  });

  // Save the PDF
  const filename = `Ergebnis_${subject}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function exportStatisticsToPdf(
  stats: {
    totalExams: number;
    averageScore: number;
    totalQuestionsSeen: number;
    subjectStats: Record<string, { exams: number; avgScore: number; bestScore: number }>;
  },
  history: ExamAttempt[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Lernstatistik', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Erstellt am ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Overall stats
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');

  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtübersicht', margin + 5, yPos + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prüfungen: ${stats.totalExams}`, margin + 5, yPos + 18);
  doc.text(`Durchschnitt: ${stats.averageScore}%`, margin + 60, yPos + 18);
  doc.text(`Fragen gesehen: ${stats.totalQuestionsSeen}`, margin + 120, yPos + 18);

  doc.setTextColor(0);
  yPos += 45;

  // Subject performance
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Leistung nach Fach', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);

  Object.entries(stats.subjectStats).forEach(([subject, data]) => {
    const subjectLabel = SUBJECT_LABELS[subject as Subject] || subject;

    doc.setFont('helvetica', 'bold');
    doc.text(subjectLabel, margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`  Prüfungen: ${data.exams}  |  Durchschnitt: ${data.avgScore}%  |  Bestes Ergebnis: ${data.bestScore}%`, margin, yPos);

    // Progress bar
    const barWidth = contentWidth - 10;
    const barHeight = 6;

    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPos + 4, barWidth, barHeight, 'F');

    const fillColor = data.avgScore >= 70 ? [34, 197, 94] : data.avgScore >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(margin, yPos + 4, barWidth * (data.avgScore / 100), barHeight, 'F');

    yPos += 15;
  });

  yPos += 10;

  // Recent exam history
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Letzte Prüfungen', margin, yPos);
  yPos += 10;

  doc.setFontSize(9);

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 3, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Datum', margin + 2, yPos + 2);
  doc.text('Fach', margin + 35, yPos + 2);
  doc.text('Ergebnis', margin + 90, yPos + 2);
  doc.text('Fragen', margin + 125, yPos + 2);
  doc.text('Zeit', margin + 155, yPos + 2);
  yPos += 10;

  doc.setFont('helvetica', 'normal');

  const recentHistory = history.slice(0, 15);
  recentHistory.forEach(attempt => {
    if (yPos > 270) {
      doc.addPage();
      yPos = margin;
    }

    doc.text(new Date(attempt.date).toLocaleDateString('de-DE'), margin + 2, yPos);
    doc.text(attempt.subject, margin + 35, yPos);

    const scoreColor = attempt.score >= 70 ? [34, 197, 94] : attempt.score >= 50 ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${attempt.score}%`, margin + 90, yPos);
    doc.setTextColor(0);

    doc.text(attempt.questionIds.length.toString(), margin + 125, yPos);
    doc.text(formatTime(attempt.timeTaken), margin + 155, yPos);

    yPos += 6;
  });

  // Save the PDF
  const filename = `Statistik_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
