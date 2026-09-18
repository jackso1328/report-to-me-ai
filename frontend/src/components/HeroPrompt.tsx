import React, { useState, useEffect } from 'react';

export const HeroPrompt: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let idleTimer: number;
    let animationTimer: number;

    const resetIdleTimer = () => {
      setIsAnimating(false);
      clearTimeout(idleTimer);
      clearTimeout(animationTimer);

      // Random interval between 15 and 35 seconds
      const delay = 15000 + Math.random() * 20000;
      
      idleTimer = window.setTimeout(() => {
        setIsAnimating(true);
        // Animation lasts ~6s, then reset
        animationTimer = window.setTimeout(() => {
          resetIdleTimer();
        }, 6500);
      }, delay);
    };

    resetIdleTimer();

    const events = ['mousemove', 'keydown', 'touchstart'];
    const handleActivity = () => resetIdleTimer();
    
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(animationTimer);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, []);

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
          animation: 'titleSecond 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
          opacity: 0,
          position: 'relative',
          display: 'inline-block'
        }}>
          happened
          <span 
            className={`story-animating-container ${isAnimating ? 'story-animating' : ''}`}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <span className={isAnimating ? 'text-transparent' : ''}>?</span>
            
            {isAnimating && (
              <>
                <span 
                  className="anim-q-body" 
                  aria-hidden="true" 
                  style={{ position: 'absolute', top: 0, left: 0, clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 82%)' }}
                >?</span>
                <span 
                  className="anim-q-dot" 
                  aria-hidden="true" 
                  style={{ position: 'absolute', top: 0, left: 0, clipPath: 'polygon(0 82%, 100% 82%, 100% 100%, 0 100%)' }}
                >?</span>
                <span 
                  className="anim-q-sparkle" 
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 0, left: 0, fontSize: '0.45em', color: 'var(--accent)' }}
                >✦</span>
              </>
            )}
          </span>
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

