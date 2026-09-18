import { useState, useEffect } from 'react';
import { Starfield } from './components/Starfield';
import { TopBar } from './components/TopBar';
import { HeroPrompt } from './components/HeroPrompt';
import { MessageComposer } from './components/MessageComposer';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisResult } from './components/AnalysisResult';
import { submitSignal } from './api/client';
import type { IncidentResponse } from './api/client';
import type { AttachmentData } from './types';
import './index.css';

type AppState = 'idle' | 'camera' | 'submitting' | 'result' | 'error';

function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [result, setResult] = useState<IncidentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<number>(1);

  useEffect(() => {
    let timer: number;
    if (appState === 'submitting') {
      setProcessingPhase(1);
      timer = window.setTimeout(() => {
        setProcessingPhase(2);
      }, 1400);
    }
    return () => clearTimeout(timer);
  }, [appState]);

  const handleSend = async (text: string) => {
    setAppState('submitting');
    setErrorMsg(null);
    
    try {
      const payload = {
        source: {
          type: 'text',
          content: text || (attachments.length > 0 ? 'An observation with attached evidence was provided.' : 'An observation was provided.')
        }
      };

      const res = await submitSignal(payload);
      setResult(res);
      setAppState('result');
      setAttachments([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setAppState('error');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setErrorMsg(null);
    setAttachments([]);
  };

  const addAttachment = (attachment: AttachmentData) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app-container">
      <Starfield />
      <TopBar />
      
      <div className="content-area">
        {appState === 'idle' && (
          <HeroPrompt />
        )}
        
        {appState === 'submitting' && (
          <div className="animate-fade-in" style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            maxWidth: '400px',
            padding: '2rem'
          }}>
            <div style={{ 
              marginBottom: '1.5rem', 
              fontSize: '2rem',
              color: 'var(--text-primary)',
              animation: 'pulseStar 2s ease-in-out infinite'
            }}>
              ✦
            </div>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.3px',
              fontWeight: 300,
              transition: 'opacity 0.3s ease'
            }}>
              {processingPhase === 1 
                ? 'Understanding what you noticed...' 
                : 'Figuring out what might help...'}
            </p>
          </div>
        )}

        {appState === 'result' && result && (
          <AnalysisResult result={result} />
        )}

        {appState === 'error' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
            <div style={{ marginBottom: '1.25rem', fontSize: '2rem', color: 'var(--danger)' }}>!</div>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {errorMsg}
            </p>
            <button 
              onClick={handleReset}
              style={{
                padding: '12px 28px',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                fontSize: '0.95rem',
                color: 'var(--text-primary)'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Floating Composer at Bottom for Idle/Error States */}
        {(appState === 'idle' || appState === 'error') && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center'
          }}>
            <MessageComposer 
              onSend={handleSend}
              onCameraClick={() => setAppState('camera')}
              isSubmitting={false}
              attachments={attachments}
              onAddAttachment={addAttachment}
              onRemoveAttachment={removeAttachment}
            />
          </div>
        )}


        {/* Result Screen Bottom Reset Action */}
        {appState === 'result' && (
          <div style={{
            position: 'absolute',
            bottom: 'max(2rem, env(safe-area-inset-bottom))',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 20
          }}>
             <button 
              onClick={handleReset}
              style={{
                padding: '12px 28px',
                backgroundColor: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '28px',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                letterSpacing: '0.3px',
                boxShadow: 'var(--glass-shadow)'
              }}
            >
              Report another observation
            </button>
          </div>
        )}
      </div>

      {appState === 'camera' && (
        <CameraCapture 
          onClose={() => setAppState('idle')}
          onCapture={(photoUrl) => {
            addAttachment({ type: 'image', url: photoUrl });
            setAppState('idle');
          }}
        />
      )}
    </div>
  );
}

export default App;


