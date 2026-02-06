import { useState, useEffect, useCallback } from 'react';
import { getAllFiles, deleteFile as dbDeleteFile, getFileStats } from '../db/database';
import type { UploadedFile, Subject } from '../db/models';

interface UseFilesResult {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  stats: Record<string, { total: number; processed: number; pending: number }>;
  refreshFiles: () => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  getFilesBySubject: (subject: Subject) => UploadedFile[];
}

export function useFiles(): UseFilesResult {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { total: number; processed: number; pending: number }>>({});

  const refreshFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allFiles = await getAllFiles();
      setFiles(allFiles);
      const fileStats = await getFileStats();
      setStats(fileStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const deleteFile = useCallback(async (id: number) => {
    try {
      await dbDeleteFile(id);
      await refreshFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
      throw err;
    }
  }, [refreshFiles]);

  const getFilesBySubject = useCallback((subject: Subject) => {
    return files.filter(f => f.subject === subject);
  }, [files]);

  return {
    files,
    loading,
    error,
    stats,
    refreshFiles,
    deleteFile,
    getFilesBySubject
  };
}
