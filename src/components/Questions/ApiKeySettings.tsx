import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { getApiKey, setApiKey, clearApiKey, hasApiKey } from '../../services/claudeService';

interface ApiKeySettingsProps {
  onKeySet?: () => void;
}

export function ApiKeySettings({ onKeySet }: ApiKeySettingsProps) {
  const [key, setKey] = useState('');
  const [isSet, setIsSet] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setIsSet(hasApiKey());
  }, []);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setIsSet(true);
      setEditing(false);
      setKey('');
      onKeySet?.();
    }
  };

  const handleClear = () => {
    clearApiKey();
    setIsSet(false);
    setKey('');
  };

  const maskedKey = () => {
    const storedKey = getApiKey();
    if (!storedKey) return '';
    if (showKey) return storedKey;
    return storedKey.slice(0, 10) + '...' + storedKey.slice(-4);
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Claude API Key</h3>
          <p className="text-sm text-gray-600">
            Required for generating questions from your course materials.
          </p>
        </div>
        {isSet && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Configured
          </span>
        )}
      </div>

      {isSet && !editing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-700">
              {maskedKey()}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Change Key
            </Button>
            <Button variant="danger" size="sm" onClick={handleClear}>
              Remove Key
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleSave} disabled={!key.trim()}>
              Save API Key
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Your API key is stored locally in your browser and never sent to our servers.
            Get your key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>
      )}
    </Card>
  );
}
