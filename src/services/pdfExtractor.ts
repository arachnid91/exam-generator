import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker - use unpkg which mirrors npm packages directly
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractTextFromPDF(
  fileData: ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<PDFExtractionResult> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;
    const pageCount = pdf.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');

      // Filter out "Beispiel" sections (example sections to skip)
      const filteredText = filterBeispielSections(pageText);
      textParts.push(filteredText);

      if (onProgress) {
        onProgress((i / pageCount) * 100);
      }
    }

    const fullText = textParts.join('\n\n--- Page Break ---\n\n');

    return {
      text: cleanExtractedText(fullText),
      pageCount
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function filterBeispielSections(text: string): string {
  // Remove content between "Beispiel:" and the next section header or double newline
  // This handles German example sections that shouldn't be used for question generation
  const beispielPattern = /Beispiel:[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi;
  return text.replace(beispielPattern, '[Example section removed]');
}

function cleanExtractedText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Fix common OCR/extraction artifacts
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
