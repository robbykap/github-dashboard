'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session, update } = useSession();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user already has an API key set
  const hasExistingKey = !!session?.openaiApiKey;

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setApiKey('');
      setMessage(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    // Basic validation - OpenAI keys start with 'sk-'
    if (!apiKey.startsWith('sk-')) {
      setMessage({ type: 'error', text: 'Invalid API key format. OpenAI keys start with "sk-"' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // Update the session with the new API key
      await update({ openaiApiKey: apiKey });
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setApiKey('');

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save API key:', error);
      setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Update the session to remove the API key
      await update({ openaiApiKey: '' });
      setMessage({ type: 'success', text: 'API key removed successfully!' });
    } catch (error) {
      console.error('Failed to remove API key:', error);
      setMessage({ type: 'error', text: 'Failed to remove API key. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gh-text-bright mb-2">OpenAI API Key</h3>
          <p className="text-sm text-gh-text-muted mb-3">
            Enter your OpenAI API key to enable AI features like issue summarization and chat-based issue creation.
            Your key is stored securely in your session.
          </p>

          {hasExistingKey && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-green-900/20 border border-green-800/30 rounded">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-400">API key is configured</span>
            </div>
          )}

          <Input
            type="password"
            placeholder={hasExistingKey ? 'Enter new key to replace existing' : 'sk-...'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isSaving}
          />
        </div>

        {message && (
          <div
            className={`text-sm p-2 rounded ${
              message.type === 'success'
                ? 'bg-green-900/20 text-green-400 border border-green-800/30'
                : 'bg-red-900/20 text-red-400 border border-red-800/30'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
            {isSaving ? 'Saving...' : 'Save API Key'}
          </Button>
          {hasExistingKey && (
            <Button variant="ghost" onClick={handleRemove} disabled={isSaving}>
              Remove Key
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        </div>

        <div className="pt-2 border-t border-gh-border">
          <p className="text-xs text-gh-text-muted">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gh-accent hover:underline"
            >
              OpenAI Platform
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
