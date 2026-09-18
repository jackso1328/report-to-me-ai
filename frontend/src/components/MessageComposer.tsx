import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Camera, Send } from 'lucide-react';
import { AttachmentSheet } from './AttachmentSheet';
import { AttachmentPreview } from './AttachmentPreview';

interface MessageComposerProps {
  onSend: (text: string, photoDataUrl: string | null) => void;
  onCameraClick: () => void;
  isSubmitting: boolean;
  capturedPhoto: string | null;
  onClearPhoto: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
  onSend, 
  onCameraClick, 
  isSubmitting,
  capturedPhoto,
  onClearPhoto
}) => {
  const [text, setText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || capturedPhoto) && !isSubmitting) {
      onSend(text.trim(), capturedPhoto);
      setText('');
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 20,
      padding: '1rem',
      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
    }}>
      
      {capturedPhoto && (
        <div style={{ marginBottom: '1rem' }}>
          <AttachmentPreview photoDataUrl={capturedPhoto} onClear={onClearPhoto} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* Main Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          backgroundColor: 'rgba(30, 41, 59, 0.4)', // transparent dark surface
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '32px',
          padding: '0.5rem 0.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <button 
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Add attachment"
            style={{ padding: '8px', opacity: 0.7 }}
          >
            <Plus size={24} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              padding: '0.5rem',
              outline: 'none',
              minWidth: 0
            }}
          />
          
          {text.trim() || capturedPhoto ? (
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ padding: '8px', color: 'var(--accent)' }}
              aria-label="Send"
            >
              <Send size={20} />
            </button>
          ) : (
            <button type="button" style={{ padding: '8px', opacity: 0.7 }} aria-label="Voice record">
              <Mic size={20} />
            </button>
          )}
        </div>

        {/* Camera Button Outside Pill */}
        <button 
          type="button"
          onClick={onCameraClick}
          aria-label="Camera"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '24px',
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <Camera size={20} />
        </button>
      </form>

      {sheetOpen && (
        <AttachmentSheet 
          onClose={() => setSheetOpen(false)} 
          onCameraClick={() => {
            setSheetOpen(false);
            onCameraClick();
          }}
        />
      )}
    </div>
  );
};
