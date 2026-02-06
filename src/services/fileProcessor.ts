import { db, updateFile, getPendingFiles } from '../db/database';
import type { UploadedFile, FileType, Subject } from '../db/models';
import { extractTextFromPDF, isPDFFile } from './pdfExtractor';
import { extractTextFromImage, isImageFile } from './ocrService';

export interface ProcessingProgress {
  fileId: number;
  fileName: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  message?: string;
}

type ProgressCallback = (progress: ProcessingProgress) => void;

export async function processFile(
  file: File,
  subject: Subject,
  onProgress?: ProgressCallback
): Promise<number> {
  // Determine file type
  let fileType: FileType;
  if (isPDFFile(file)) {
    fileType = 'pdf';
  } else if (isImageFile(file)) {
    fileType = file.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  } else {
    throw new Error('Unsupported file type. Please upload PDF, PNG, or JPG files.');
  }

  // Read file data
  const fileData = await file.arrayBuffer();

  // Create database entry
  const uploadedFile: Omit<UploadedFile, 'id'> = {
    name: file.name,
    subject,
    fileType,
    uploadDate: new Date(),
    extractedText: '',
    processingStatus: 'pending',
    fileSize: file.size,
    fileData
  };

  const fileId = await db.uploadedFiles.add(uploadedFile);

  // Start processing
  await processFileById(fileId, onProgress);

  return fileId;
}

export async function processFileById(
  fileId: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const file = await db.uploadedFiles.get(fileId);
  if (!file) {
    throw new Error('File not found');
  }

  if (!file.fileData) {
    throw new Error('File data not available for processing');
  }

  try {
    // Update status to processing
    await updateFile(fileId, { processingStatus: 'processing' });

    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'processing',
        message: 'Starting extraction...'
      });
    }

    let extractedText: string;
    let pageCount: number | undefined;

    if (file.fileType === 'pdf') {
      const result = await extractTextFromPDF(
        file.fileData,
        (progress) => {
          if (onProgress) {
            onProgress({
              fileId,
              fileName: file.name,
              progress,
              status: 'processing',
              message: `Extracting text... ${Math.round(progress)}%`
            });
          }
        }
      );
      extractedText = result.text;
      pageCount = result.pageCount;
    } else {
      const result = await extractTextFromImage(
        file.fileData,
        (progress) => {
          if (onProgress) {
            onProgress({
              fileId,
              fileName: file.name,
              progress,
              status: 'processing',
              message: `Running OCR... ${Math.round(progress)}%`
            });
          }
        }
      );
      extractedText = result.text;
    }

    // Update with extracted text
    await updateFile(fileId, {
      extractedText,
      pageCount,
      processingStatus: 'completed',
      fileData: undefined // Clear file data to save space after processing
    });

    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 100,
        status: 'completed',
        message: 'Extraction complete'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateFile(fileId, {
      processingStatus: 'error',
      errorMessage
    });

    if (onProgress) {
      onProgress({
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'error',
        message: errorMessage
      });
    }

    throw error;
  }
}

export async function processAllPendingFiles(
  onProgress?: ProgressCallback
): Promise<void> {
  const pendingFiles = await getPendingFiles();

  for (const file of pendingFiles) {
    if (file.id) {
      try {
        await processFileById(file.id, onProgress);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with next file
      }
    }
  }
}

export async function retryFailedFile(
  fileId: number,
  onProgress?: ProgressCallback
): Promise<void> {
  const file = await db.uploadedFiles.get(fileId);
  if (!file) {
    throw new Error('File not found');
  }

  if (file.processingStatus !== 'error') {
    throw new Error('File is not in error state');
  }

  // Reset status and retry
  await updateFile(fileId, {
    processingStatus: 'pending',
    errorMessage: undefined
  });

  await processFileById(fileId, onProgress);
}
