import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
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

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(dataUrl);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '1.5rem',
        zIndex: 210
      }}>
        <button onClick={onClose} style={{ color: '#fff', padding: '8px' }}>
          <X size={32} />
        </button>
      </div>

      {errorMsg ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#fff', textAlign: 'center' }}>
          <p>{errorMsg}</p>
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
          bottom: 'max(2rem, env(safe-area-inset-bottom))',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 210
        }}>
          {/* Capture Button */}
          <button 
            onClick={takePhoto}
            aria-label="Take photo"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '36px',
              border: '4px solid #fff',
              backgroundColor: 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              backgroundColor: '#fff'
            }} />
          </button>
        </div>
      )}

    </div>
  );
};
