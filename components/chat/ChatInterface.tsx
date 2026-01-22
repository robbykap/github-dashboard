'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { Button, Spinner } from '@/components/ui';
import MessageBubble from './MessageBubble';
import type { ChatMessage } from '@/types/ai';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInterface({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled && inputValue.trim()) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gh-text-muted">
            <p>Start a conversation to create an issue</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gh-bg-tertiary rounded-lg px-4 py-3">
                  <Spinner size="sm" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gh-border p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="
              flex-1 px-3 py-2 bg-gh-bg border border-gh-border rounded-md text-gh-text
              placeholder-gh-text-muted resize-none
              focus:outline-none focus:ring-2 focus:ring-gh-accent focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
          <Button
            onClick={onSendMessage}
            disabled={disabled || isLoading || !inputValue.trim()}
            loading={isLoading}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
