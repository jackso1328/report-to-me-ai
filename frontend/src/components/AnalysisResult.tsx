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
      color = '#f87171';
      bg = 'rgba(239, 68, 68, 0.08)';
      border = 'rgba(239, 68, 68, 0.25)';
      Icon = UserCheck;
      break;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '6px 16px',
      borderRadius: '20px',
      border: `1px solid ${border}`,
      color: color,
      backgroundColor: bg,
      fontSize: '0.8rem',
      fontWeight: 600,
      letterSpacing: '1px',
      boxShadow: `0 4px 16px ${bg}`
    }}>
      <Icon size={14} strokeWidth={2.2} />
      <span>{label}</span>
    </div>
  );
};

export const AnalysisResult: React.FC<{ result: IncidentResponse }> = ({ result }) => {
  const { analysis, decision } = result;

  const isHumanReview = decision.path === 'human_review';

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      maxWidth: '560px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem 1.5rem 6rem 1.5rem'
    }}>
      
      <div style={{ fontSize: '1.75rem', marginBottom: '1.75rem', opacity: 0.8, color: 'var(--text-primary)' }}>✦</div>

      {/* Primary Understanding Header */}
      <div style={{ marginBottom: '2.5rem', width: '100%' }}>
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '0.6rem', 
          textTransform: 'uppercase', 
          fontSize: '0.75rem', 
          letterSpacing: '1.5px',
          fontWeight: 500
        }}>
          I understand this as
        </p>
        <h2 className="display-text" style={{ 
          fontSize: 'clamp(2rem, 5vw, 2.75rem)', 
          lineHeight: 1.15,
          color: 'var(--text-primary)'
        }}>
          {analysis.understanding.summary}
        </h2>
      </div>

      <div style={{ 
        width: '32px', 
        height: '1px', 
        backgroundColor: 'var(--border-color)', 
        margin: '0 auto 2.5rem auto' 
      }} />

      {/* Recommended Action / Human Review Wording */}
      <div style={{ marginBottom: '2.5rem', width: '100%' }}>
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '0.6rem', 
          textTransform: 'uppercase', 
          fontSize: '0.75rem', 
          letterSpacing: '1.5px',
          fontWeight: 500
        }}>
          {isHumanReview ? 'Attention Required' : 'What you can do'}
        </p>
        <p style={{ 
          fontSize: 'clamp(1.05rem, 2.5vw, 1.25rem)', 
          lineHeight: 1.5, 
          fontWeight: 400,
          color: 'var(--text-primary)'
        }}>
          {isHumanReview 
            ? 'This observation may need appropriate human attention.' 
            : analysis.guidance.recommendedAction}
        </p>
        
        {isHumanReview && (
          <p style={{ 
            fontSize: '0.95rem', 
            lineHeight: 1.5, 
            color: 'var(--text-secondary)',
            marginTop: '0.75rem',
            fontWeight: 300
          }}>
            {decision.reasoning || analysis.guidance.recommendedAction}
          </p>
        )}
      </div>

      {/* Risk and Confidence Assessment Line */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem', 
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '1.2px',
        marginBottom: '1.5rem'
      }}>
        <span>● {analysis.assessment.severity} risk</span>
        <span>● {analysis.assessment.confidence > 0.8 ? 'High' : 'Moderate'} confidence</span>
      </div>

      <DecisionBadge path={decision.path} />

    </div>
  );
};

