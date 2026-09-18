import React from 'react';
import { X } from 'lucide-react';

interface AttachmentPreviewProps {
  photoDataUrl: string;
  onClear: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ photoDataUrl, onClear }) => {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      <img 
        src={photoDataUrl} 
        alt="Captured attachment" 
        style={{
          width: '60px',
          height: '60px',
          objectFit: 'cover',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}
      />
      <button 
        type="button"
        onClick={onClear}
        style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          backgroundColor: 'var(--surface)',
          borderRadius: '50%',
          padding: '2px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
