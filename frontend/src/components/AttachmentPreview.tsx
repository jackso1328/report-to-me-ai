import React, { useRef, useEffect } from 'react';
import { X, FileText, Play, Pause } from 'lucide-react';
import type { AttachmentData } from '../types';

interface AttachmentPreviewProps {
  attachment: AttachmentData;
  onClear: () => void;
}

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment, onClear }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: attachment.type === 'image' ? '4px' : '8px 12px',
    boxShadow: 'var(--glass-shadow)'
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: 'var(--surface)',
    borderRadius: '50%',
    padding: '4px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-secondary)'
  };

  return (
    <div style={containerStyle}>
      {attachment.type === 'image' && (
        <img 
          src={attachment.url} 
          alt={attachment.name || 'Captured attachment'} 
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'cover',
            borderRadius: '8px'
          }}
        />
      )}

      {attachment.type === 'file' && (
        <>
          <FileText size={20} color="var(--text-secondary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {attachment.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {formatSize(attachment.size)}
            </span>
          </div>
        </>
      )}

      {attachment.type === 'audio' && (
        <>
          <button 
            type="button" 
            onClick={togglePlay}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Voice Recording</span>
          <audio 
            ref={audioRef} 
            src={attachment.url} 
            onEnded={() => setIsPlaying(false)} 
            style={{ display: 'none' }} 
          />
        </>
      )}

      <button type="button" onClick={onClear} style={closeButtonStyle} aria-label="Remove attachment">
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
};

