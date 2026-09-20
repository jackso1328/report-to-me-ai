import { useState, useEffect } from 'react';
import { Starfield } from './components/Starfield';
import { TopBar } from './components/TopBar';
import { HeroPrompt } from './components/HeroPrompt';
import { MessageComposer } from './components/MessageComposer';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisResult } from './components/AnalysisResult';
import { submitSignal, getPresignedUrl, uploadToS3, getIncidentById } from './api/client';
import type { IncidentResponse, EvidenceMetadata, SignalPayload } from './api/client';
import type { AttachmentData } from './types';
import { ReviewQueue } from './components/ReviewQueue';
import { IncidentDetail } from './components/IncidentDetail';
import './index.css';

type AppState = 'idle' | 'camera' | 'submitting' | 'polling' | 'result' | 'error' | 'reviewQueue' | 'incidentDetail';

function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [result, setResult] = useState<IncidentResponse | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processingPhase, setProcessingPhase] = useState<number>(1);

  useEffect(() => {
    let timer: number | undefined;
    if (appState === 'submitting') {
      setProcessingPhase(1);
    }
    return () => clearTimeout(timer);
  }, [appState]);

  useEffect(() => {
    let pollInterval: number;
    let timeout: number;

    const pollIncident = async (id: string) => {
      try {
        const data = await getIncidentById(id);
        if (data.status !== 'new' && data.processingState !== 'queued' && data.processingState !== 'pending') {
          if (data.processingState === 'failed') {
            setErrorMsg("Your observation was recorded, but analysis could not be completed yet.");
            setAppState('error');
          } else {
            setResult(data);
            setAppState('result');
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    if (appState === 'polling' && result?.id) {
      // Poll every 2 seconds
      pollInterval = window.setInterval(() => {
        setProcessingPhase(prev => prev + 1);
        pollIncident(result.id);
      }, 2000);

      // Timeout after 180 seconds
      timeout = window.setTimeout(() => {
        setErrorMsg("Your observation has been safely recorded. Please try again in a moment.");
        setAppState('error');
      }, 180000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (timeout) clearTimeout(timeout);
    };
  }, [appState, result?.id]);

  const handleSend = async (text: string) => {
    setAppState('submitting');
    setErrorMsg(null);
    
    try {
      const evidenceMetadataList: EvidenceMetadata[] = [];
      
      // Upload attachments if any
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.file) {
            // Get presigned URL
            const presigned = await getPresignedUrl(attachment.file);
            
            // Upload to S3
            await uploadToS3(presigned.uploadUrl, attachment.file);
            
            // Add metadata
            evidenceMetadataList.push({
              evidenceId: presigned.evidenceId,
              objectKey: presigned.objectKey,
              contentType: attachment.file.type,
              size: attachment.file.size
            });
          }
        }
      }

      const payload: SignalPayload = {
        source: {
          type: 'text',
          content: text || (attachments.length > 0 ? 'An observation with attached evidence was provided.' : 'An observation was provided.')
        },
        ...(evidenceMetadataList.length > 0 && { evidence: evidenceMetadataList })
      };

      const res = await submitSignal(payload);
      
      setResult(res);
      setAttachments([]);

      if (res.processingState === 'queued' || res.processingState === 'pending') {
        setAppState('polling');
      } else {
        setAppState('result');
      }
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
      <TopBar 
        onNavigateHome={() => setAppState('idle')} 
        onNavigateReview={() => setAppState('reviewQueue')} 
      />
      
      <div className={`content-area ${['result', 'reviewQueue', 'incidentDetail'].includes(appState) ? 'align-top' : ''}`}>
        {appState === 'idle' && (
          <HeroPrompt />
        )}
        
        {(appState === 'submitting' || appState === 'polling') && (
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
              marginBottom: '2rem', 
              fontSize: '2.5rem',
              color: 'var(--text-primary)',
              animation: 'pulseStar 2s ease-in-out infinite'
            }}>
              ✦
            </div>
            {appState === 'submitting' && (
              <p style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                letterSpacing: '0.5px',
                fontWeight: 400
              }}>
                Observation received...
              </p>
            )}
            {appState === 'polling' && (
              <div style={{ 
                position: 'relative', 
                height: '2rem', 
                width: '100%',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <p 
                  className="animate-shimmer"
                  style={{
                  position: 'absolute',
                  fontSize: '1rem',
                  letterSpacing: '3px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: processingPhase < 15 ? 1 : 0,
                  transform: processingPhase < 15 ? 'translateY(0)' : 'translateY(15px)'
                }}>
                  Understanding
                </p>
                <p 
                  className="animate-shimmer"
                  style={{
                  position: 'absolute',
                  fontSize: '1rem',
                  letterSpacing: '3px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: processingPhase >= 15 && processingPhase < 60 ? 1 : 0,
                  transform: processingPhase >= 15 && processingPhase < 60 ? 'translateY(0)' : processingPhase < 15 ? 'translateY(-15px)' : 'translateY(15px)'
                }}>
                  Analyzing
                </p>
                <p 
                  className="animate-shimmer"
                  style={{
                  position: 'absolute',
                  fontSize: '1rem',
                  letterSpacing: '3px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: processingPhase >= 60 ? 1 : 0,
                  transform: processingPhase >= 60 ? 'translateY(0)' : 'translateY(-15px)'
                }}>
                  Finalizing
                </p>
              </div>
            )}
          </div>
        )}

        {appState === 'result' && result && (
          <AnalysisResult result={result} />
        )}

        {appState === 'reviewQueue' && (
          <ReviewQueue onSelectIncident={(id) => {
            setSelectedIncidentId(id);
            setAppState('incidentDetail');
          }} />
        )}

        {appState === 'incidentDetail' && selectedIncidentId && (
          <IncidentDetail 
            incidentId={selectedIncidentId} 
            onBack={() => setAppState('reviewQueue')} 
          />
        )}

        {appState === 'error' && (
          <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem', fontSize: '2.5rem', color: 'var(--text-muted)' }}>✦</div>
            <p style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 500 }}>
              We couldn't finish the analysis just yet.
            </p>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.95rem' }}>
              {errorMsg}
            </p>
            <button 
              className="pill-button"
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
            position: 'relative',
            marginTop: '1rem',
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
          onCapture={(photoUrl, blob) => {
            const attachmentFile = blob ? new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' }) : undefined;
            addAttachment({ type: 'image', url: photoUrl, file: attachmentFile });
            setAppState('idle');
          }}
        />
      )}
    </div>
  );
}

export default App;


