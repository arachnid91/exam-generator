import { Card } from '../ui/Card';
import { Progress } from '../ui/Progress';
import type { ProcessingProgress } from '../../services/fileProcessor';

interface ProcessingStatusProps {
  processing: boolean;
  progress: Map<number, ProcessingProgress>;
  currentFile: string | null;
  overallProgress: number;
}

export function ProcessingStatus({
  processing,
  progress,
  currentFile: _currentFile,
  overallProgress
}: ProcessingStatusProps) {
  void _currentFile; // Acknowledge unused prop for now
  if (!processing && progress.size === 0) {
    return null;
  }

  const activeItems = Array.from(progress.values()).filter(
    (p) => p.status === 'processing'
  );
  const completedItems = Array.from(progress.values()).filter(
    (p) => p.status === 'completed'
  );
  const errorItems = Array.from(progress.values()).filter(
    (p) => p.status === 'error'
  );

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Processing Status</h2>
        <div className="flex items-center space-x-4 text-sm">
          {completedItems.length > 0 && (
            <span className="text-green-600">
              {completedItems.length} completed
            </span>
          )}
          {errorItems.length > 0 && (
            <span className="text-red-600">
              {errorItems.length} failed
            </span>
          )}
        </div>
      </div>

      {processing && (
        <div className="mb-4">
          <Progress
            value={overallProgress}
            color="blue"
            showLabel
            label="Overall Progress"
          />
        </div>
      )}

      {activeItems.length > 0 && (
        <div className="space-y-3">
          {activeItems.map((item) => (
            <div
              key={item.fileId}
              className="p-3 bg-blue-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 truncate">
                  {item.fileName}
                </span>
                <span className="text-xs text-blue-600">
                  {Math.round(item.progress)}%
                </span>
              </div>
              <Progress value={item.progress} size="sm" color="blue" />
              {item.message && (
                <p className="mt-1 text-xs text-blue-700">{item.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {errorItems.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-red-800">Failed Files</h3>
          {errorItems.map((item) => (
            <div
              key={item.fileId}
              className="p-2 bg-red-50 rounded text-sm text-red-700"
            >
              <span className="font-medium">{item.fileName}:</span>{' '}
              {item.message}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
