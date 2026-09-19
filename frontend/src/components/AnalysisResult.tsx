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
      maxWidth: '560px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem 1.5rem 6rem 1.5rem',
      gap: '2rem'
    }}>
      
      {/* 1. Decision Badge at top to anchor the state */}
      <DecisionBadge path={decision.path} />

      {/* 2. What happened (Understanding) */}
      <div style={{ width: '100%' }}>
        <h2 className="display-text" style={{ 
          fontSize: 'clamp(2rem, 5vw, 2.75rem)', 
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          {analysis.understanding.summary}
        </h2>
        
        {/* Assessment Line immediately below summary */}
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem', 
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          padding: '8px 16px',
          backgroundColor: 'var(--glass-bg)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)'
        }}>
          <span>● {analysis.assessment.severity} risk</span>
          <span>● {analysis.assessment.confidence > 0.8 ? 'High' : 'Moderate'} confidence</span>
        </div>
      </div>

      {/* 3. What to do (Guidance Box) */}
      <div style={{ 
        width: '100%',
        backgroundColor: boxBg,
        border: `1px solid ${boxBorder}`,
        borderRadius: '24px',
        padding: '2rem',
        marginTop: '0.5rem',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '1rem', 
          textTransform: 'uppercase', 
          fontSize: '0.75rem', 
          letterSpacing: '1.5px',
          fontWeight: 600
        }}>
          {isHumanReview ? 'Attention Required' : 'What you can do'}
        </p>
        <p style={{ 
          fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', 
          lineHeight: 1.6, 
          fontWeight: 400,
          color: 'var(--text-primary)'
        }}>
          {isHumanReview 
            ? 'This observation may need appropriate human attention.' 
            : analysis.guidance.recommendedAction}
        </p>
      </div>

      {/* 4. Why? (Expandable Explanation) */}
      <details 
        className="why-details"
        style={{
          width: '100%',
          textAlign: 'left',
          backgroundColor: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          padding: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <summary style={{
          padding: '1rem',
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
          padding: '0 1rem 1.25rem 1rem',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          fontWeight: 400,
          borderTop: '1px solid var(--border-color)',
          paddingTop: '1rem',
          marginTop: '0.25rem'
        }}>
          {decision.reasoning}
        </div>
      </details>

    </div>
  );
};

