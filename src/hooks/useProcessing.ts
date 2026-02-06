import { useState, useCallback } from 'react';
import { processFile, type ProcessingProgress, processAllPendingFiles, retryFailedFile } from '../services/fileProcessor';
import type { Subject } from '../db/models';

interface UseProcessingResult {
  processing: boolean;
  progress: Map<number, ProcessingProgress>;
  currentFile: string | null;
  uploadAndProcess: (file: File, subject: Subject) => Promise<number>;
  uploadMultiple: (files: File[], subject: Subject) => Promise<number[]>;
  processAllPending: () => Promise<void>;
  retryFile: (fileId: number) => Promise<void>;
  overallProgress: number;
}

export function useProcessing(onComplete?: () => void): UseProcessingResult {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<Map<number, ProcessingProgress>>(new Map());
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [totalFiles, setTotalFiles] = useState(0);
  const [completedFiles, setCompletedFiles] = useState(0);

  const handleProgress = useCallback((progressUpdate: ProcessingProgress) => {
    setProgress(prev => {
      const newMap = new Map(prev);
      newMap.set(progressUpdate.fileId, progressUpdate);
      return newMap;
    });
    setCurrentFile(progressUpdate.fileName);

    if (progressUpdate.status === 'completed' || progressUpdate.status === 'error') {
      setCompletedFiles(prev => prev + 1);
    }
  }, []);

  const uploadAndProcess = useCallback(async (file: File, subject: Subject): Promise<number> => {
    setProcessing(true);
    setTotalFiles(1);
    setCompletedFiles(0);

    try {
      const fileId = await processFile(file, subject, handleProgress);
      onComplete?.();
      return fileId;
    } finally {
      setProcessing(false);
      setCurrentFile(null);
    }
  }, [handleProgress, onComplete]);

  const uploadMultiple = useCallback(async (files: File[], subject: Subject): Promise<number[]> => {
    setProcessing(true);
    setTotalFiles(files.length);
    setCompletedFiles(0);

    const fileIds: number[] = [];

    try {
      for (const file of files) {
        try {
          const fileId = await processFile(file, subject, handleProgress);
          fileIds.push(fileId);
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          // Continue with next file
        }
      }
      onComplete?.();
      return fileIds;
    } finally {
      setProcessing(false);
      setCurrentFile(null);
    }
  }, [handleProgress, onComplete]);

  const processAllPending = useCallback(async () => {
    setProcessing(true);

    try {
      await processAllPendingFiles(handleProgress);
      onComplete?.();
    } finally {
      setProcessing(false);
      setCurrentFile(null);
    }
  }, [handleProgress, onComplete]);

  const retryFile = useCallback(async (fileId: number) => {
    setProcessing(true);

    try {
      await retryFailedFile(fileId, handleProgress);
      onComplete?.();
    } finally {
      setProcessing(false);
      setCurrentFile(null);
    }
  }, [handleProgress, onComplete]);

  const overallProgress = totalFiles > 0 ? (completedFiles / totalFiles) * 100 : 0;

  return {
    processing,
    progress,
    currentFile,
    uploadAndProcess,
    uploadMultiple,
    processAllPending,
    retryFile,
    overallProgress
  };
}
