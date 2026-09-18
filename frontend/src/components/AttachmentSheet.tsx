import React from 'react';
import { Image, File, Mic } from 'lucide-react';

interface AttachmentSheetProps {
  onClose: () => void;
  onCameraClick: () => void;
}

export const AttachmentSheet: React.FC<AttachmentSheetProps> = ({ onClose, onCameraClick }) => {
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 100,
          backdropFilter: 'blur(2px)'
        }}
        onClick={onClose}
      />
      
      <div className="animate-slide-up" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        padding: '2rem 1.5rem',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        zIndex: 101,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
      }}>
        
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: 'var(--border-color)',
          borderRadius: '2px',
          margin: '0 auto 1.5rem auto'
        }} />

        <h3 style={{ marginBottom: '1rem', fontWeight: 500 }}>Add to your report</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button onClick={onCameraClick} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            width: '100%',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <Image size={24} />
            <span>Photo or Video</span>
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            width: '100%',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <File size={24} />
            <span>File</span>
          </button>

          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            width: '100%',
            textAlign: 'left',
            transition: 'background-color 0.2s'
          }}>
            <Mic size={24} />
            <span>Voice Recording</span>
          </button>
        </div>

        <button onClick={onClose} style={{
          marginTop: '1rem',
          padding: '1rem',
          width: '100%',
          textAlign: 'center',
          opacity: 0.8
        }}>
          Cancel
        </button>

      </div>
    </>
  );
};
