import React from 'react';

export const HeroPrompt: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      flex: 1,
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      marginTop: '-10vh'
    }} className="animate-fade-in">
      <h1 className="display-text" style={{
        fontSize: '4.5rem',
        lineHeight: 1.1,
        marginBottom: '1rem',
        fontWeight: 'normal',
        textShadow: '0 0 40px rgba(255,255,255,0.1)'
      }}>
        What<br />happened?
      </h1>
      <p style={{
        fontSize: '1.1rem',
        opacity: 0.8,
        letterSpacing: '0.5px',
        fontWeight: 300
      }}>
        Tell us what you noticed.
      </p>
    </div>
  );
};
