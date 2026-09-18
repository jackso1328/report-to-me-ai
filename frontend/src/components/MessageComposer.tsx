import React, { useState, useRef } from 'react';
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
  const [isFocused, setIsFocused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canSend = (text.trim().length > 0 || capturedPhoto !== null) && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSend) {
      onSend(text.trim(), capturedPhoto);
      setText('');
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '620px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 20,
      padding: '0.75rem 1rem',
      paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
    }}>
      
      {capturedPhoto && (
        <div style={{ marginBottom: '0.75rem' }}>
          <AttachmentPreview photoDataUrl={capturedPhoto} onClear={onClearPhoto} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* Main Floating Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isFocused ? 'var(--border-focus)' : 'var(--glass-border)'}`,
          borderRadius: '36px',
          padding: '0.4rem 0.5rem',
          boxShadow: isFocused 
            ? '0 12px 36px rgba(0, 0, 0, 0.35), 0 0 20px rgba(59, 130, 246, 0.12)' 
            : 'var(--glass-shadow)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isSubmitting ? 0.6 : 1
        }}>
          <button 
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Add attachment"
            disabled={isSubmitting}
            style={{ 
              padding: '10px', 
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Type what you noticed..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              padding: '0.5rem 0.25rem',
              outline: 'none',
              minWidth: 0
            }}
          />
          
          {canSend ? (
            <button 
              type="submit" 
              disabled={isSubmitting}
              aria-label="Send observation"
              style={{ 
                padding: '10px', 
                color: '#ffffff',
                backgroundColor: 'var(--accent)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
                transform: isSubmitting ? 'scale(0.95)' : 'scale(1)'
              }}
            >
              <Send size={18} strokeWidth={2} />
            </button>
          ) : (
            <button 
              type="button" 
              disabled={isSubmitting}
              aria-label="Voice input"
              style={{ 
                padding: '10px', 
                color: 'var(--text-secondary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mic size={20} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Camera Button Outside Pill */}
        <button 
          type="button"
          onClick={onCameraClick}
          disabled={isSubmitting}
          aria-label="Open Camera"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '26px',
            backgroundColor: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            color: 'var(--text-primary)',
            flexShrink: 0
          }}
        >
          <Camera size={22} strokeWidth={1.75} />
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

