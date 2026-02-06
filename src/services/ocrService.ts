import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

let worker: Tesseract.Worker | null = null;

async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    worker = await Tesseract.createWorker('deu+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
  }
  return worker;
}

export async function extractTextFromImage(
  imageData: ArrayBuffer | Blob | string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    const tesseractWorker = await getWorker();

    // Convert ArrayBuffer to Blob if needed
    let imageInput: Blob | string;
    if (imageData instanceof ArrayBuffer) {
      imageInput = new Blob([imageData]);
    } else {
      imageInput = imageData;
    }

    const result = await tesseractWorker.recognize(imageInput, {

    }, {
      text: true
    });

    if (onProgress) {
      onProgress(100);
    }

    return {
      text: cleanOCRText(result.data.text),
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function cleanOCRText(text: string): string {
  return text
    // Remove common OCR artifacts
    .replace(/[|]/g, 'I')
    .replace(/[{}]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Fix common German character issues
    .replace(/a\s*:\s*/g, 'ä')
    .replace(/o\s*:\s*/g, 'ö')
    .replace(/u\s*:\s*/g, 'ü')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Trim
    .trim();
}

export function isImageFile(file: File): boolean {
  const imageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  return imageTypes.includes(file.type) ||
    /\.(png|jpg|jpeg)$/i.test(file.name);
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
