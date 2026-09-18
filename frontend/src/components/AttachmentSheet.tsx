import React, { useEffect, useRef } from 'react';
import { Image, File as FileIcon, Mic } from 'lucide-react';
import type { AttachmentData } from '../types';

interface AttachmentSheetProps {
  onClose: () => void;
  onFileSelect: (attachment: AttachmentData) => void;
  onVoiceSelect: () => void;
}

export const AttachmentSheet: React.FC<AttachmentSheetProps> = ({ 
  onClose, 
  onFileSelect,
  onVoiceSelect
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onFileSelect({
      type,
      url,
      file,
      name: file.name,
      size: file.size
    });
  };

  return (
    <>
      <div 
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
      />
      
      <div className="animate-slide-up" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--surface)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        padding: '1.75rem 1.5rem',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        zIndex: 101,
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
        maxWidth: '640px',
        margin: '0 auto'
      }}>
        
        <div style={{
          width: '36px',
          height: '4px',
          backgroundColor: 'var(--border-color)',
          borderRadius: '2px',
          margin: '0 auto 1.5rem auto'
        }} />

        <h3 style={{ 
          marginBottom: '1.25rem', 
          fontWeight: 500,
          fontSize: '1.1rem',
          color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          Add to your report
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          
          <input 
            type="file" 
            ref={imageInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, 'image')}
          />
          <button 
            onClick={() => imageInputRef.current?.click()} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              textAlign: 'left',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              minHeight: '52px'
            }}
          >
            <Image size={22} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
            <span>Photo / Image</span>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/*,video/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, 'file')}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              textAlign: 'left',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              minHeight: '52px'
            }}
          >
            <FileIcon size={22} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
            <span>File</span>
          </button>

          <button 
            onClick={onVoiceSelect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.1rem 1.25rem',
              borderRadius: '16px',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              width: '100%',
              textAlign: 'left',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              minHeight: '52px'
            }}
          >
            <Mic size={22} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
            <span>Voice Recording</span>
          </button>
        </div>

        <button onClick={onClose} style={{
          marginTop: '1rem',
          padding: '0.9rem',
          width: '100%',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.95rem'
        }}>
          Cancel
        </button>

      </div>
    </>
  );
};

