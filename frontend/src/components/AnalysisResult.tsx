import React from 'react';
import type { IncidentResponse } from '../api/client';

export const DecisionBadge: React.FC<{ path: string }> = ({ path }) => {
  let label = 'UNKNOWN';
  let color = 'var(--text-secondary)';
  let bg = 'transparent';
  let border = 'var(--border-color)';

  switch (path) {
    case 'self_solve':
      label = 'SELF-SOLVE';
      color = 'var(--success)';
      border = 'var(--success)';
      break;
    case 'monitor':
      label = 'MONITOR';
      color = 'var(--warning)';
      border = 'var(--warning)';
      break;
    case 'human_review':
      label = 'HUMAN REVIEW';
      color = 'var(--danger)';
      border = 'var(--danger)';
      break;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '16px',
      border: `1px solid ${border}`,
      color: color,
      backgroundColor: bg,
      fontSize: '0.8rem',
      fontWeight: 600,
      letterSpacing: '1px',
      marginTop: '1rem'
    }}>
      {label}
    </div>
  );
};

export const AnalysisResult: React.FC<{ result: IncidentResponse }> = ({ result }) => {
  const { analysis, decision } = result;

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem'
    }}>
      
      <div style={{ fontSize: '2rem', marginBottom: '2rem', opacity: 0.8 }}>✦</div>

      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
          I understand this as...
        </p>
        <h2 className="display-text" style={{ fontSize: '2.5rem', lineHeight: 1.2 }}>
          {analysis.understanding.summary}
        </h2>
      </div>

      <div style={{ 
        width: '40px', 
        height: '1px', 
        backgroundColor: 'var(--border-color)', 
        margin: '0 auto 2.5rem auto' 
      }} />

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>
          What you can do
        </p>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.5, fontWeight: 500 }}>
          {analysis.guidance.recommendedAction}
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        alignItems: 'center',
        opacity: 0.7,
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '1rem'
      }}>
        <div>● {analysis.assessment.severity} risk</div>
        <div>● {analysis.assessment.confidence > 0.8 ? 'High' : 'Moderate'} confidence</div>
      </div>

      <DecisionBadge path={decision.path} />

    </div>
  );
};
