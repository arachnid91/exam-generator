import { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { type UploadedFile, SUBJECT_COLORS, SUBJECTS, type Subject } from '../../db/models';

interface FileListProps {
  files: UploadedFile[];
  onDelete: (id: number) => Promise<void>;
  onRetry?: (id: number) => Promise<void>;
}

export function FileList({ files, onDelete, onRetry }: FileListProps) {
  const [expandedFile, setExpandedFile] = useState<number | null>(null);
  const [filterSubject, setFilterSubject] = useState<Subject | 'all'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredFiles = filterSubject === 'all'
    ? files
    : files.filter((f) => f.subject === filterSubject);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Processed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error
          </span>
        );
      default:
        return null;
    }
  };

  if (files.length === 0) {
    return (
      <Card className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload some PDF or image files to get started.
        </p>
      </Card>
    );
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex items-center space-x-2">
        <span className="text-sm text-gray-600">Filter:</span>
        <button
          onClick={() => setFilterSubject('all')}
          className={`px-3 py-1 rounded-full text-sm ${
            filterSubject === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({files.length})
        </button>
        {SUBJECTS.map((subject) => {
          const count = files.filter((f) => f.subject === subject).length;
          if (count === 0) return null;
          return (
            <button
              key={subject}
              onClick={() => setFilterSubject(subject)}
              className={`px-3 py-1 rounded-full text-sm ${
                filterSubject === subject
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {subject} ({count})
            </button>
          );
        })}
      </div>

      {/* File List */}
      <div className="space-y-3">
        {filteredFiles.map((file) => (
          <Card key={file.id} padding="sm" className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[file.subject]}`}>
                    {file.subject}
                  </span>
                  {getStatusBadge(file.processingStatus)}
                </div>
                <h3 className="mt-1 text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </h3>
                <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                  <span>{file.fileType.toUpperCase()}</span>
                  <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                  {file.pageCount && <span>{file.pageCount} pages</span>}
                  <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                </div>
                {file.errorMessage && (
                  <p className="mt-1 text-xs text-red-600">{file.errorMessage}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {file.processingStatus === 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id!)}
                  >
                    {expandedFile === file.id ? 'Hide' : 'Preview'}
                  </Button>
                )}
                {file.processingStatus === 'error' && onRetry && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onRetry(file.id!)}
                  >
                    Retry
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingId === file.id}
                  onClick={() => handleDelete(file.id!)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Expanded Text Preview */}
            {expandedFile === file.id && file.extractedText && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-xs font-medium text-gray-500 mb-2">
                  Extracted Text Preview
                </h4>
                <div className="text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {file.extractedText.slice(0, 1000)}
                  {file.extractedText.length > 1000 && '...'}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Total: {file.extractedText.length} characters
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
