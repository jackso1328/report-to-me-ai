import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Camera, Send, Square } from 'lucide-react';
import { AttachmentSheet } from './AttachmentSheet';
import { AttachmentPreview } from './AttachmentPreview';
import type { AttachmentData } from '../types';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface MessageComposerProps {
  onSend: (text: string) => void;
  onCameraClick: () => void;
  isSubmitting: boolean;
  attachments: AttachmentData[];
  onAddAttachment: (attachment: AttachmentData) => void;
  onRemoveAttachment: (index: number) => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
  onSend, 
  onCameraClick, 
  isSubmitting,
  attachments,
  onAddAttachment,
  onRemoveAttachment
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    isRecording,
    recordingBlob,
    error: voiceError,
    waveformStream,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecorder();

  // If a voice recording finishes, add it as an attachment
  useEffect(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      onAddAttachment({
        type: 'audio',
        url,
        file: recordingBlob,
        size: recordingBlob.size
      });
      clearRecording();
    }
  }, [recordingBlob, onAddAttachment, clearRecording]);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isSubmitting;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (canSend && !isSubmitting) {
      onSend(text);
      setText('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
      
      {voiceError && (
        <div style={{ marginBottom: '0.5rem', color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center' }}>
          {voiceError}
        </div>
      )}

      {attachments.length > 0 && (
        <div style={{ 
          marginBottom: '0.75rem', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem' 
        }}>
          {attachments.map((attachment, idx) => (
            <AttachmentPreview 
              key={attachment.url + idx} 
              attachment={attachment} 
              onClear={() => onRemoveAttachment(idx)} 
            />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.75rem'
      }}>
        {/* Main Floating Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          flex: 1,
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${isFocused || isRecording ? 'var(--border-focus)' : 'var(--glass-border)'}`,
          borderRadius: '24px',
          padding: '0.4rem 0.5rem',
          boxShadow: isFocused || isRecording
            ? '0 12px 36px rgba(0, 0, 0, 0.35), 0 0 20px rgba(59, 130, 246, 0.12)' 
            : 'var(--glass-shadow)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: isSubmitting ? 0.6 : 1
        }}>
          <button 
            type="button"
            className="icon-button"
            onClick={() => setSheetOpen(true)}
            aria-label="Add attachment"
            disabled={isSubmitting || isRecording}
            style={{ 
              padding: '10px', 
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isRecording ? 0.5 : 1,
              marginBottom: '2px'
            }}
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>
          
          {isRecording ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.5rem',
              gap: '2px',
              height: '42px'
            }}>
              {waveformStream ? (
                Array.from(waveformStream).map((val, i) => {
                  const height = Math.max(2, Math.abs(val) * 40);
                  return (
                    <div 
                      key={i} 
                      style={{
                        width: '3px',
                        height: `${height}px`,
                        backgroundColor: 'var(--danger)',
                        borderRadius: '2px',
                        transition: 'height 0.05s ease'
                      }}
                    />
                  );
                })
              ) : (
                <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Recording...</span>
              )}
            </div>
          ) : (
            <textarea
              ref={inputRef}
              className="hide-scrollbar"
              rows={1}
              placeholder="Type what you noticed..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isSubmitting}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                padding: '0.6rem 0.25rem',
                outline: 'none',
                minWidth: 0,
                resize: 'none',
                overflowY: 'auto',
                lineHeight: '1.4',
                maxHeight: '150px'
              }}
            />
          )}
          
          {canSend && !isRecording ? (
            <button 
              type="button" 
              className="icon-button"
              onClick={() => handleSubmit()}
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
                transform: isSubmitting ? 'scale(0.95)' : 'scale(1)',
                marginBottom: '2px',
                marginLeft: '4px'
              }}
            >
              <Send size={18} strokeWidth={2} />
            </button>
          ) : (
            <button 
              type="button" 
              className="icon-button"
              onClick={handleMicClick}
              disabled={isSubmitting}
              aria-label={isRecording ? "Stop recording" : "Voice input"}
              style={{ 
                padding: '10px', 
                color: isRecording ? 'var(--danger)' : 'var(--text-secondary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isRecording ? 'pulseStar 1.5s ease-in-out infinite' : 'none',
                marginBottom: '2px',
                marginLeft: '4px'
              }}
            >
              {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} strokeWidth={1.75} />}
            </button>
          )}
        </div>

        {/* Camera Button Outside Pill */}
        <button 
          type="button"
          className="pill-button"
          onClick={onCameraClick}
          disabled={isSubmitting || isRecording}
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
            flexShrink: 0,
            opacity: isRecording ? 0.5 : 1
          }}
        >
          <Camera size={22} strokeWidth={1.75} />
        </button>
      </form>

      {sheetOpen && (
        <AttachmentSheet 
          onClose={() => setSheetOpen(false)} 
          onFileSelect={(attachment) => {
            onAddAttachment(attachment);
            setSheetOpen(false);
          }}
          onVoiceSelect={() => {
            setSheetOpen(false);
            startRecording();
          }}
        />
      )}
    </div>
  );
};
