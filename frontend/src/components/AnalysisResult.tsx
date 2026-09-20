import React from 'react';
import { CheckCircle2, Eye, UserCheck } from 'lucide-react';
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
      color = '#f43f5e'; /* Less panic red, more coral/rose */
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
  const { analysis, decision } = result;

  const isHumanReview = decision.path === 'human_review';
  const isSelfSolve = decision.path === 'self_solve';

  // Determine guidance box colors
  const boxBg = isHumanReview ? 'rgba(244, 63, 94, 0.05)' : 
                isSelfSolve ? 'rgba(16, 185, 129, 0.05)' : 
                'rgba(245, 158, 11, 0.05)';
  const boxBorder = isHumanReview ? 'rgba(244, 63, 94, 0.2)' : 
                    isSelfSolve ? 'rgba(16, 185, 129, 0.2)' : 
                    'rgba(245, 158, 11, 0.2)';

  return (
    <div className="animate-fade-in" style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem 1.5rem 6rem 1.5rem',
      gap: '1.5rem'
    }}>
      
      <DecisionBadge path={decision.path} />

      <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* WHAT HAPPENED */}
        <div style={{ padding: '0.5rem 0' }}>
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

        {/* GUIDANCE BOX */}
        <div style={{ 
          width: '100%',
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
              {isHumanReview ? 'Attention Required' : 'What To Do'}
            </p>
            <p style={{ 
              fontSize: '1.15rem', 
              lineHeight: 1.6, 
              color: 'var(--text-primary)'
            }}>
              {isHumanReview 
                ? 'This observation may need appropriate human attention.' 
                : analysis.guidance?.recommendedAction || 'No specific action recommended.'}
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
          
          {/* LOCATION PERMISSION MESSAGE */}
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
        </div>

        {/* WHY (Expandable) */}
        <details 
          className="why-details"
          style={{
            width: '100%',
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

    </div>
  );
};

