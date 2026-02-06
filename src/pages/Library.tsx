import { useState } from 'react';
import { FileUpload } from '../components/FileUpload/FileUpload';
import { FileList } from '../components/FileUpload/FileList';
import { ProcessingStatus } from '../components/FileUpload/ProcessingStatus';
import { FolderImport, type FileWithSubject } from '../components/FileUpload/FolderImport';
import { useFiles } from '../hooks/useFiles';
import { useProcessing } from '../hooks/useProcessing';
import type { Subject } from '../db/models';

export function Library() {
  const { files, loading, error, refreshFiles, deleteFile, stats } = useFiles();
  const {
    processing,
    progress,
    currentFile,
    uploadMultiple,
    retryFile,
    overallProgress
  } = useProcessing(refreshFiles);

  const [uploadMode, setUploadMode] = useState<'single' | 'folder'>('single');

  const handleUpload = async (fileList: File[], subject: Subject) => {
    await uploadMultiple(fileList, subject);
    await refreshFiles();
  };

  const handleFolderImport = async (filesWithSubjects: FileWithSubject[]) => {
    // Group files by subject and upload each group
    const bySubject = filesWithSubjects.reduce((acc, f) => {
      if (!acc[f.subject]) acc[f.subject] = [];
      acc[f.subject].push(f.file);
      return acc;
    }, {} as Record<Subject, File[]>);

    for (const [subject, subjectFiles] of Object.entries(bySubject)) {
      await uploadMultiple(subjectFiles, subject as Subject);
    }
    await refreshFiles();
  };

  const handleRetry = async (fileId: number) => {
    await retryFile(fileId);
    await refreshFiles();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="ml-2 text-gray-600">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg
            className="h-5 w-5 text-red-500 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">File Library</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload and manage your course materials. Supported formats: PDF, PNG, JPG.
        </p>
      </div>

      {/* Stats Summary */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(stats).map(([subject, s]) => (
            <div
              key={subject}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {subject}
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {s.processed}
                <span className="text-sm font-normal text-gray-400">/{s.total}</span>
              </div>
              {s.pending > 0 && (
                <div className="text-xs text-yellow-600 mt-1">
                  {s.pending} pending
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Mode Toggle */}
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm text-gray-600">Upload mode:</span>
        <button
          onClick={() => setUploadMode('single')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            uploadMode === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Single Files
        </button>
        <button
          onClick={() => setUploadMode('folder')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            uploadMode === 'folder'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Folder Import
        </button>
      </div>

      {uploadMode === 'single' ? (
        <FileUpload onUpload={handleUpload} processing={processing} />
      ) : (
        <FolderImport onImport={handleFolderImport} processing={processing} />
      )}

      <ProcessingStatus
        processing={processing}
        progress={progress}
        currentFile={currentFile}
        overallProgress={overallProgress}
      />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Uploaded Files ({files.length})
        </h2>
        <FileList
          files={files}
          onDelete={deleteFile}
          onRetry={handleRetry}
        />
      </div>
    </div>
  );
}
