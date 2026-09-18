import React, { useState } from 'react';
import { Starfield } from './components/Starfield';
import { TopBar } from './components/TopBar';
import { HeroPrompt } from './components/HeroPrompt';
import { MessageComposer } from './components/MessageComposer';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisResult } from './components/AnalysisResult';
import { submitSignal } from './api/client';
import type { IncidentResponse } from './api/client';
import './index.css';

type AppState = 'idle' | 'camera' | 'submitting' | 'result' | 'error';

function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSend = async (text: string, photoDataUrl: string | null) => {
    setAppState('submitting');
    setErrorMsg(null);
    
    try {
      // In this milestone, we only submit the text observation
      // S3 upload of the photoDataUrl will be in a future milestone.
      
      const payload = {
        source: {
          type: 'text',
          content: text || 'An observation with an image was provided.'
        }
      };

      const res = await submitSignal(payload);
      setResult(res);
      setAppState('result');
      setCapturedPhoto(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setAppState('error');
    }
  };

  const handleReset = () => {
    setAppState('idle');
    setResult(null);
    setErrorMsg(null);
    setCapturedPhoto(null);
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
          <div className="animate-fade-in" style={{ textAlign: 'center', opacity: 0.7 }}>
            <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>✦</div>
            <p>Understanding observation...</p>
          </div>
        )}

        {appState === 'result' && result && (
          <AnalysisResult result={result} />
        )}

        {appState === 'error' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ marginBottom: '1rem', fontSize: '2rem', color: 'var(--danger)' }}>!</div>
            <p style={{ marginBottom: '2rem' }}>{errorMsg}</p>
            <button 
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)'
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Floating Composer at Bottom for specific states */}
        {(appState === 'idle' || appState === 'error') && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <MessageComposer 
              onSend={handleSend}
              onCameraClick={() => setAppState('camera')}
              isSubmitting={appState === 'submitting'}
              capturedPhoto={capturedPhoto}
              onClearPhoto={() => setCapturedPhoto(null)}
            />
          </div>
        )}

        {/* Result Screen Bottom Action */}
        {appState === 'result' && (
          <div style={{
            position: 'absolute',
            bottom: 'max(2rem, env(safe-area-inset-bottom))',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center'
          }}>
             <button 
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--surface)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                opacity: 0.8
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
            setCapturedPhoto(photoUrl);
            setAppState('idle');
          }}
        />
      )}
    </div>
  );
}

export default App;
