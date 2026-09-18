import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<number | null>(null);

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
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
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
    onCapture(dataUrl);
  };

  const handlePointerDown = () => {
    holdTimerRef.current = window.setTimeout(() => {
      setIsHolding(true);
    }, 250);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    if (isHolding) {
      setIsHolding(false);
      // Visual indicator for video hold finish (photo captured as fallback in current milestone)
      takePhoto();
    } else {
      takePhoto();
    }
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
          textTransform: 'uppercase'
        }}>
          {isHolding ? 'Recording Video...' : 'Tap for photo, hold for video'}
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
          {/* Dual-action Capture Button */}
          <button 
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            aria-label="Capture photo or video"
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              border: `4px solid ${isHolding ? '#ef4444' : '#ffffff'}`,
              backgroundColor: isHolding ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isHolding ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isHolding ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 8px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{
              width: isHolding ? '36px' : '58px',
              height: isHolding ? '36px' : '58px',
              borderRadius: isHolding ? '8px' : '50%',
              backgroundColor: isHolding ? '#ef4444' : '#ffffff',
              transition: 'all 0.2s ease'
            }} />
          </button>
        </div>
      )}

    </div>
  );
};

