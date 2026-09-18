import React from 'react';

export const HeroPrompt: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      width: '100%',
      maxWidth: '640px',
      margin: 'auto 0',
      padding: '2rem 1rem'
    }}>
      <h1 className="display-text" style={{
        fontSize: 'clamp(3.5rem, 8vw, 5.2rem)',
        lineHeight: 1.05,
        marginBottom: '1.25rem',
        fontWeight: 400,
        textShadow: '0 0 50px rgba(255,255,255,0.08)'
      }}>
        <span style={{
          display: 'block',
          animation: 'titleFirst 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          What
        </span>
        <span style={{
          display: 'block',
          animation: 'titleSecond 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
          opacity: 0
        }}>
          happened?
        </span>
      </h1>
      <p style={{
        fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
        color: 'var(--text-secondary)',
        letterSpacing: '0.4px',
        fontWeight: 300,
        animation: 'subtitleFade 0.6s ease 0.35s forwards',
        opacity: 0
      }}>
        Tell us what you noticed.
      </p>
    </div>
  );
};

