import { useState, useCallback, useRef } from 'react';
import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { getButtonStyles } from '../ui/Button';
import { type Subject, SUBJECT_FOLDER_MAP } from '../../db/models';

interface FileWithSubject {
  file: File;
  subject: Subject;
  folderName: string;
}

interface FolderImportProps {
  onImport: (files: FileWithSubject[]) => Promise<void>;
  processing: boolean;
}

function detectSubject(path: string): Subject | null {
  const lowerPath = path.toLowerCase();

  for (const [folderName, subject] of Object.entries(SUBJECT_FOLDER_MAP)) {
    if (lowerPath.includes(folderName.toLowerCase())) {
      return subject;
    }
  }

  // Additional pattern matching
  if (lowerPath.includes('public relation') || lowerPath.includes('pr/')) {
    return 'PR';
  }
  if (lowerPath.includes('journal')) {
    return 'Journalism';
  }
  if (lowerPath.includes('audio') || lowerPath.includes('visual')) {
    return 'Audio-Visualism';
  }
  if (lowerPath.includes('publizistik') || lowerPath.includes('publicity')) {
    return 'Publicity';
  }

  return null;
}

function isValidFile(file: File): boolean {
  const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
  const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];

  return validTypes.includes(file.type) ||
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

export function FolderImport({ onImport, processing }: FolderImportProps) {
  const [detectedFiles, setDetectedFiles] = useState<FileWithSubject[]>([]);
  const [scanning, setScanning] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setScanning(true);
    const filesWithSubjects: FileWithSubject[] = [];
    const unknownSubjectFiles: { file: File; folderName: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!isValidFile(file)) continue;

      // Get the relative path (includes folder structure)
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      const folderName = relativePath.split('/')[0] || 'Unknown';

      const subject = detectSubject(relativePath);

      if (subject) {
        filesWithSubjects.push({ file, subject, folderName });
      } else {
        unknownSubjectFiles.push({ file, folderName });
      }
    }

    // For files without detected subject, default to 'PR'
    unknownSubjectFiles.forEach(({ file, folderName }) => {
      filesWithSubjects.push({ file, subject: 'PR', folderName });
    });

    setDetectedFiles(filesWithSubjects);
    setScanning(false);
  }, []);

  const handleImport = useCallback(async () => {
    if (detectedFiles.length === 0) return;

    setImportProgress(0);
    await onImport(detectedFiles);
    setDetectedFiles([]);
    setImportProgress(100);

    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  }, [detectedFiles, onImport]);

  const removeFile = useCallback((index: number) => {
    setDetectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const changeSubject = useCallback((index: number, newSubject: Subject) => {
    setDetectedFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, subject: newSubject } : f
    ));
  }, []);

  // Group files by subject for display
  const filesBySubject = detectedFiles.reduce((acc, f) => {
    if (!acc[f.subject]) acc[f.subject] = [];
    acc[f.subject].push(f);
    return acc;
  }, {} as Record<Subject, FileWithSubject[]>);

  return (
    <Card className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Batch Import from Folders</h2>
      <p className="text-sm text-gray-600 mb-4">
        Select a folder containing your course materials. Subjects will be auto-detected based on folder names.
      </p>

      <div className="mb-4">
        <input
          ref={folderInputRef}
          type="file"
          /* @ts-expect-error webkitdirectory is not in the type definitions */
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
          id="folder-input"
        />
        <label
          htmlFor="folder-input"
          className={`${getButtonStyles('secondary')} cursor-pointer ${(scanning || processing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {scanning ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Scanning...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Select Folder
            </>
          )}
        </label>
      </div>

      {/* Expected folder structure hint */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
        <p className="font-medium mb-1">Expected folder names:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><span className="font-mono">Public Relations/</span> → PR</li>
          <li><span className="font-mono">journalismus/</span> → Journalism</li>
          <li><span className="font-mono">Audiovisueller Jurnalismus/</span> → Audio-Visualism</li>
          <li><span className="font-mono">publizistik wissenschaft/</span> → Publicity</li>
        </ul>
      </div>

      {/* Detected files summary */}
      {detectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Detected {detectedFiles.length} files
            </h3>
            <button
              onClick={handleImport}
              disabled={processing}
              className={`${getButtonStyles('primary')} ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {processing && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Import All
            </button>
          </div>

          {processing && (
            <Progress value={importProgress} showLabel label="Importing..." />
          )}

          {/* Files grouped by subject */}
          {Object.entries(filesBySubject).map(([subject, files]) => (
            <div key={subject} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {subject}
                </span>
                <span className="text-xs text-gray-500">
                  {files.length} files
                </span>
              </div>
              <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                {files.slice(0, 5).map((f, idx) => {
                  const globalIndex = detectedFiles.indexOf(f);
                  return (
                    <li key={idx} className="px-3 py-2 flex items-center justify-between text-sm">
                      <span className="truncate flex-1 text-gray-700">{f.file.name}</span>
                      <div className="flex items-center space-x-2 ml-2">
                        <select
                          value={f.subject}
                          onChange={(e) => changeSubject(globalIndex, e.target.value as Subject)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                        >
                          <option value="PR">PR</option>
                          <option value="Audio-Visualism">Audio-Visualism</option>
                          <option value="Publicity">Publicity</option>
                          <option value="Journalism">Journalism</option>
                        </select>
                        <button
                          onClick={() => removeFile(globalIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
                {files.length > 5 && (
                  <li className="px-3 py-2 text-xs text-gray-500 text-center">
                    ... and {files.length - 5} more files
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export type { FileWithSubject };
