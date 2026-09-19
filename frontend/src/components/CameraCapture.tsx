import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string, blob?: Blob) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setErrorMsg("We couldn't access your camera. Check your browser permissions and try again.");
      }
    };

    startCamera();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [onClose]);

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(dataUrl, blob);
      } else {
        onCapture(dataUrl);
      }
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Top Bar with Safe Area */}
      <div style={{
        position: 'absolute',
        top: 'max(1.5rem, env(safe-area-inset-top))',
        left: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 210
      }}>
        <button 
          onClick={onClose} 
          aria-label="Close camera"
          style={{ 
            color: '#ffffff', 
            padding: '10px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={24} strokeWidth={1.75} />
        </button>

        <span style={{ 
          color: 'rgba(255,255,255,0.7)', 
          fontSize: '0.8rem',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontWeight: 500,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: '16px'
        }}>
          Photo
        </span>
      </div>

      {errorMsg ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#ffffff', textAlign: 'center' }}>
          <p style={{ maxWidth: '360px', color: '#94a3b8', lineHeight: 1.5 }}>{errorMsg}</p>
        </div>
      ) : (
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}

      {!errorMsg && (
        <div style={{
          position: 'absolute',
          bottom: 'max(2.5rem, env(safe-area-inset-bottom))',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 210
        }}>
          {/* Premium Capture Button */}
          <button 
            onClick={takePhoto}
            className="icon-button"
            aria-label="Capture photo"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid #ffffff',
              backgroundColor: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }} />
          </button>
        </div>
      )}

    </div>
  );
};

