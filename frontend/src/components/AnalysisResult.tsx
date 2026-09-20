import React, { useState } from 'react';
import { CheckCircle2, Eye, UserCheck, MapPin, ShieldAlert, Workflow, Brain, ClipboardCheck, Check, Users } from 'lucide-react';
import type { IncidentResponse } from '../api/client';

export const DecisionBadge: React.FC<{ path: string }> = ({ path }) => {
  let label = 'UNKNOWN';
  let color = 'var(--text-secondary)';
  let bg = 'rgba(148, 163, 184, 0.1)';
  let border = 'var(--border-color)';
  let Icon = Eye;

  switch (path) {
    case 'self_solve':
      label = 'SELF-SOLVE';
      color = 'var(--success)';
      bg = 'rgba(16, 185, 129, 0.08)';
      border = 'rgba(16, 185, 129, 0.25)';
      Icon = CheckCircle2;
      break;
    case 'monitor':
      label = 'MONITOR';
      color = 'var(--warning)';
      bg = 'rgba(245, 158, 11, 0.08)';
      border = 'rgba(245, 158, 11, 0.25)';
      Icon = Eye;
      break;
    case 'human_review':
      label = 'HUMAN REVIEW';
      color = '#f43f5e';
      bg = 'rgba(244, 63, 94, 0.08)';
      border = 'rgba(244, 63, 94, 0.25)';
      Icon = UserCheck;
      break;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '8px 18px',
      borderRadius: '24px',
      border: `1px solid ${border}`,
      color: color,
      backgroundColor: bg,
      fontSize: '0.85rem',
      fontWeight: 600,
      letterSpacing: '1px',
      boxShadow: `0 8px 24px ${bg}`
    }}>
      <Icon size={16} strokeWidth={2.5} />
      <span>{label}</span>
    </div>
  );
};

export interface AnalysisResultProps {
  result: IncidentResponse;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [handoffState, setHandoffState] = useState<'idle' | 'prepared'>('idle');

  const { analysis, decision } = result;

  const isHumanReview = decision.path === 'human_review';
  const isMonitor = decision.path === 'monitor';
  const isSelfSolve = decision.path === 'self_solve';
  const isTwoColumn = isHumanReview || isMonitor;

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('denied');
      return;
    }
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      () => setLocationState('granted'),
      () => setLocationState('denied')
    );
  };

  const boxBg = isHumanReview ? 'rgba(244, 63, 94, 0.05)' : 
                isSelfSolve ? 'rgba(16, 185, 129, 0.05)' : 
                'rgba(245, 158, 11, 0.05)';
  const boxBorder = isHumanReview ? 'rgba(244, 63, 94, 0.2)' : 
                    isSelfSolve ? 'rgba(16, 185, 129, 0.2)' : 
                    'rgba(245, 158, 11, 0.2)';

  const cardBg = 'var(--glass-bg)';
  const cardBorder = 'var(--glass-border)';

  return (
    <div className={`animate-fade-in analysis-container ${isTwoColumn ? 'wide' : ''}`} style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem 1.5rem 6rem 1.5rem',
      gap: '1.5rem'
    }}>
      
      <DecisionBadge path={decision.path} />

      <div className={`analysis-grid ${isTwoColumn ? 'two-column' : ''}`}>
        
        {/* ========================================== */}
        {/* LEFT COLUMN: CORE ANALYSIS                 */}
        {/* ========================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* WHAT HAPPENED */}
          <div style={{ padding: '0.5rem 0', textAlign: 'left' }}>
            <h2 style={{ 
              fontSize: '1.75rem', 
              lineHeight: 1.3,
              color: 'var(--text-primary)',
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              {analysis.understanding?.summary || 'Observation recorded'}
            </h2>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              gap: '1rem', 
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              padding: '6px 12px',
              backgroundColor: 'var(--glass-bg)',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)'
            }}>
              <span>● {analysis.assessment?.severity || 'Unknown'} risk</span>
              <span>● {analysis.assessment?.confidence > 0.8 ? 'High' : 'Moderate'} confidence</span>
            </div>
          </div>

          {/* WHAT TO DO NOW */}
          <div style={{ 
            width: '100%',
            textAlign: 'left',
            backgroundColor: boxBg,
            border: `1px solid ${boxBorder}`,
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <p style={{ 
                color: 'var(--text-muted)', 
                marginBottom: '0.5rem', 
                textTransform: 'uppercase', 
                fontSize: '0.75rem', 
                letterSpacing: '1.5px',
                fontWeight: 600
              }}>
                What To Do Now
              </p>
              <p style={{ 
                fontSize: '1.15rem', 
                lineHeight: 1.6, 
                color: 'var(--text-primary)'
              }}>
                {analysis.guidance?.recommendedAction || 'No specific action recommended.'}
              </p>
            </div>
            
            {analysis.guidance?.responsibleParty && (
              <div>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  marginBottom: '0.25rem', 
                  textTransform: 'uppercase', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1.5px',
                  fontWeight: 600
                }}>
                  Who Should Handle It
                </p>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  {analysis.guidance.responsibleParty}
                </p>
              </div>
            )}
            
            {/* If NOT two columns, show Report Context here. If two column, location is on right. */}
            {!isTwoColumn && (
              <div style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                <p style={{ 
                  color: 'var(--text-muted)', 
                  marginBottom: '0.25rem', 
                  textTransform: 'uppercase', 
                  fontSize: '0.75rem', 
                  letterSpacing: '1px',
                  fontWeight: 600
                }}>
                  Report Context
                </p>
                <p>Location can be included in the report if you allow location access. This helps the responsible party find the exact spot.</p>
              </div>
            )}
          </div>

          {/* WHY (Expandable) */}
          <details 
            className="why-details"
            style={{
              width: '100%',
              textAlign: 'left',
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: '16px',
              cursor: 'pointer'
            }}
          >
            <summary style={{
              padding: '1rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              userSelect: 'none',
              outline: 'none'
            }}>
              Why was this recommended?
            </summary>
            <div style={{
              padding: '0 1.25rem 1.25rem 1.25rem',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border-color)',
              paddingTop: '1rem',
            }}>
              {decision.reasoning}
            </div>
          </details>

        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: OPERATIONAL CARDS            */}
        {/* ========================================== */}
        {isTwoColumn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', textAlign: 'left' }}>
            
            {/* MEDIUM RISK (MONITOR) */}
            {isMonitor && (
              <div style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: '20px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', fontWeight: 600 }}>
                  Response Status
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Situation assessed</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Required information prepared</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Responsible team identified</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--success)" /> Information shared through prototype workflow</li>
                </ul>
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Information has been shared with the required responsible team. They can take the appropriate action shortly.
                  </p>
                </div>
              </div>
            )}

            {/* HIGH RISK (HUMAN_REVIEW) */}
            {isHumanReview && (
              <>
                {/* CARD A: INCIDENT RESPONSE */}
                <div style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <div>
                    <p style={{ color: 'rgba(244, 63, 94, 0.8)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldAlert size={14} /> Human Response Required
                    </p>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                      Preparing the information needed for the appropriate responsible team.
                    </p>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Brain size={16} color="var(--accent)" /> Incident understood</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldAlert size={16} color="var(--accent)" /> Risk assessment completed</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={16} color="var(--accent)" /> Responsible team identified</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ClipboardCheck size={16} color="var(--accent)" /> Response guidance prepared</li>
                  </ul>
                </div>

                {/* CARD B: LOCATION */}
                <div style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} /> Incident Location
                  </p>
                  <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2px' }}>Reported location:</p>
                    <p style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {result.signals?.[0]?.location?.description || 'Main Gate'}
                    </p>
                  </div>
                  <div style={{
                    marginTop: '0.25rem',
                    padding: '1rem',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {locationState === 'idle' && (
                      <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                          Your current location can help determine what nearby assistance may be appropriate.
                        </p>
                        <button 
                          onClick={requestLocation}
                          className="pill-button"
                          style={{ padding: '8px 16px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                          Allow Location
                        </button>
                      </>
                    )}
                    {locationState === 'requesting' && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Collecting your location...</p>
                    )}
                    {locationState === 'granted' && (
                      <>
                        <p style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                          <CheckCircle2 size={14} /> Your location has been collected
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                          This helps determine what nearby assistance or services may be appropriate.
                        </p>
                      </>
                    )}
                    {locationState === 'denied' && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                        Location access wasn't granted. The reported incident location will still be used.
                      </p>
                    )}
                  </div>
                </div>

                {/* CARD C: RESPONSIBLE PERSONNEL */}
                <div style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} /> Responsible Personnel
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--accent)' }}>
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                        {analysis.guidance?.responsibleParty || 'Campus Security / Safety Team'}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {result.category || analysis.assessment?.severity + ' incident response'}
                      </p>
                      <p style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                         <Check size={12}/> Response prepared
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                      Responsible personnel have been identified for the required response.
                    </p>
                  </div>
                </div>

                {/* CARD D: HUMAN HANDOFF */}
                <div style={{
                  backgroundColor: cardBg,
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '20px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <p style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Workflow size={14} /> Human Handoff
                  </p>
                  
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--success)" /> Incident summary prepared</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--success)" /> Risk assessment prepared</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--success)" /> Location status checked</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--success)" /> Responsible personnel identified</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="var(--success)" /> Recommended response prepared</li>
                  </ul>
                  
                  {handoffState === 'idle' ? (
                    <>
                      <div style={{ marginTop: '0.5rem' }}>
                        <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500 }}>
                          Ready for human authorization
                        </p>
                      </div>
                      <button 
                        onClick={() => setHandoffState('prepared')}
                        className="pill-button"
                        style={{ padding: '12px', backgroundColor: '#f43f5e', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, width: '100%', marginTop: '0.25rem', cursor: 'pointer' }}
                      >
                        Review & Authorize
                      </button>
                    </>
                  ) : (
                    <div className="animate-fade-in" style={{ marginTop: '0.5rem' }}>
                      <p style={{ color: 'var(--success)', fontSize: '1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Response handoff prepared
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
                        The responsible team can proceed with the required response.
                      </p>
                    </div>
                  )}
                  <p style={{ color: 'rgba(244, 63, 94, 0.8)', fontSize: '0.75rem', marginTop: '1rem', textAlign: 'center', opacity: 0.8 }}>
                    Prototype handoff — external contact actions are simulated.
                  </p>
                </div>
              </>
            )}
            
          </div>
        )}

      </div>
    </div>
  );
};
