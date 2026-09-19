import React, { useState, useEffect, useRef, useCallback } from 'react';

type AnimPhase = 'IDLE' | 'ESCAPE' | 'DOT_AT_DESTINATION' | 'SEARCH' | 'RECONNECT' | 'RETURN_HOME';

const AnimatedQuestionMark: React.FC<{ onIdleReset: (fn: () => void) => void }> = ({ onIdleReset }) => {
  const [phase, setPhase] = useState<AnimPhase>('IDLE');
  const containerRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const sparkleRef = useRef<HTMLSpanElement>(null);
  const targetPosRef = useRef({ x: 0, y: 0 });
  const idleTimerRef = useRef<number | undefined>(undefined);
  const animTimeoutRef = useRef<number | undefined>(undefined);
  const isCancelledRef = useRef(false);

  const resetIdle = useCallback(() => {
    isCancelledRef.current = true;
    setPhase('IDLE');
    if (idleTimerRef.current !== undefined) clearTimeout(idleTimerRef.current);
    if (animTimeoutRef.current !== undefined) clearTimeout(animTimeoutRef.current);

    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.transition = 'none';
      containerRef.current.style.filter = '';
    }
    if (dotRef.current) {
      dotRef.current.style.transform = 'translate(-50%, 0)';
      dotRef.current.style.transition = 'none';
      dotRef.current.style.filter = '';
    }
    if (sparkleRef.current) {
      sparkleRef.current.style.opacity = '0';
      sparkleRef.current.style.transition = 'none';
    }

    idleTimerRef.current = window.setTimeout(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
         resetIdle();
         return;
      }
      isCancelledRef.current = false;
      setPhase('ESCAPE');
    }, 30000);
  }, []);

  useEffect(() => {
    onIdleReset(resetIdle);
    resetIdle();
    return () => {
      if (idleTimerRef.current !== undefined) clearTimeout(idleTimerRef.current);
      if (animTimeoutRef.current !== undefined) clearTimeout(animTimeoutRef.current);
    };
  }, [onIdleReset, resetIdle]);

  useEffect(() => {
    if (phase === 'IDLE') return;

    const wait = (ms: number) => new Promise(r => {
      animTimeoutRef.current = window.setTimeout(r, ms);
    });

    const checkCancel = () => isCancelledRef.current;

    const runPhase = async () => {
      const container = containerRef.current;
      const dot = dotRef.current;
      const sparkle = sparkleRef.current;
      if (!container || !dot || !sparkle) return;

      if (phase === 'ESCAPE') {
        const rect = container.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const minDist = Math.min(vw, vh) * 0.25;

        let targetX = minDist;
        let targetY = -minDist;

        for (let i = 0; i < 30; i++) {
          const rx = vw * 0.1 + Math.random() * (vw * 0.8);
          const ry = vh * 0.15 + Math.random() * (vh * 0.55);
          const dx = rx - (rect.left + rect.width / 2);
          const dy = ry - (rect.top + rect.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
            targetX = dx; targetY = dy;
            break;
          }
        }
        targetPosRef.current = { x: targetX, y: targetY };

        // Zero gravity float away
        const escapeDur = 2500 + Math.random() * 1000;
        dot.style.transition = `transform ${escapeDur}ms ease-out, filter ${escapeDur}ms ease`;
        const randomRot = Math.random() * 90 - 45;
        dot.style.transform = `translate(calc(-50% + ${targetX}px), ${targetY}px) scale(0.8) rotate(${randomRot}deg)`;
        dot.style.filter = 'brightness(1.5)';

        await wait(escapeDur);
        if (checkCancel()) return;
        setPhase('DOT_AT_DESTINATION');
      }

      else if (phase === 'DOT_AT_DESTINATION') {
        const { x, y } = targetPosRef.current;
        
        // Gentle float at destination
        dot.style.transition = 'transform 4s ease-in-out';
        dot.style.transform = `translate(calc(-50% + ${x + 3}px), ${y - 4}px) scale(0.8) rotate(10deg)`;
        
        await wait(800);
        if (checkCancel()) return;

        // Container tilt left (anticipation)
        container.style.transition = 'transform 0.8s ease-in-out';
        container.style.transform = 'rotate(-3deg) translateY(-2px)';
        await wait(1000);
        if (checkCancel()) return;
        
        // Container tilt right
        container.style.transform = 'rotate(4deg) translateX(2px)';
        await wait(1000);
        if (checkCancel()) return;

        setPhase('SEARCH');
      }

      else if (phase === 'SEARCH') {
        const { x: targetX, y: targetY } = targetPosRef.current;
        const dist = Math.sqrt(targetX*targetX + targetY*targetY);
        const travelDur = Math.min(Math.max(dist / 200 * 1000, 1200), 2200);

        container.style.transition = 'none';
        dot.style.transition = 'none';

        await new Promise<void>((resolve) => {
          const startTime = performance.now();
          const startX = 0; const startY = 0;
          const endX = targetX; const endY = targetY;
          const mx = (startX + endX) / 2;
          const my = (startY + endY) / 2;
          const dx = endX - startX;
          const dy = endY - startY;
          
          const cx = mx - dy * 0.15;
          const cy = my + dx * 0.15;

          const step = (time: number) => {
            if (checkCancel()) { resolve(); return; }
            let p = (time - startTime) / travelDur;
            if (p > 1) p = 1;
            const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            
            const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX;
            const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY;
            
            const rot = (x - startX) * 0.04;
            container.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
            
            const dotRelX = targetX - x;
            const dotRelY = targetY - y;
            dot.style.transform = `translate(calc(-50% + ${dotRelX}px), ${dotRelY}px) scale(0.8) rotate(10deg)`;

            if (p < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });

        if (checkCancel()) return;
        setPhase('RECONNECT');
      }

      else if (phase === 'RECONNECT') {
        const { x: targetX, y: targetY } = targetPosRef.current;
        
        await wait(100);
        if (checkCancel()) return;

        // Soft reconnect
        dot.style.transition = 'transform 250ms ease-out, filter 250ms ease';
        dot.style.transform = `translate(-50%, 0) scale(1) rotate(0deg)`; 
        dot.style.filter = 'brightness(1)';
        
        // Tiny pulse on body
        container.style.transition = 'transform 300ms ease-in-out';
        container.style.transform = `translate(${targetX}px, ${targetY}px) scale(1.02) rotate(0deg)`;
        
        await wait(250);
        if (checkCancel()) return;

        container.style.transform = `translate(${targetX}px, ${targetY}px) scale(1) rotate(0deg)`;

        await wait(250);
        if (checkCancel()) return;
        
        setPhase('RETURN_HOME');
      }

      else if (phase === 'RETURN_HOME') {
        const { x: targetX, y: targetY } = targetPosRef.current;
        const dist = Math.sqrt(targetX*targetX + targetY*targetY);
        const returnDur = Math.min(Math.max(dist / 200 * 1000, 1000), 1500);

        container.style.transition = 'none';
        dot.style.transition = 'none';

        await new Promise<void>((resolve) => {
          const startTime = performance.now();
          const startX = targetX; const startY = targetY;
          const endX = 0; const endY = 0;
          const mx = (startX + endX) / 2;
          const my = (startY + endY) / 2;
          const dx = endX - startX;
          const dy = endY - startY;
          const cx = mx + dy * 0.1; 
          const cy = my - dx * 0.1;

          const step = (time: number) => {
            if (checkCancel()) { resolve(); return; }
            let p = (time - startTime) / returnDur;
            if (p > 1) p = 1;
            const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            
            const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX;
            const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY;
            
            container.style.transform = `translate(${x}px, ${y}px)`;

            if (p < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });

        if (checkCancel()) return;

        container.style.transform = '';
        container.style.transition = 'none';
        
        await wait(200);
        if (checkCancel()) return;
        
        resetIdle();
      }
    };

    runPhase();
  }, [phase, resetIdle]);

  const isAnimating = phase !== 'IDLE';

  return (
    <span 
      ref={containerRef}
      className={`animated-qm-wrapper ${!isAnimating ? 'idle-float' : ''}`}
      aria-hidden="true"
      style={{ 
        display: 'inline-block', 
        position: 'relative', 
        width: '0.45em', 
        height: '0.8em', 
        marginLeft: '0.08em',
        color: 'inherit',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <svg viewBox="0 0 100 150" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
        <path 
          d="M 20,45 C 20,10 80,10 80,45 C 80,75 50,85 50,115" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="16" 
          strokeLinecap="round" 
        />
        <circle 
          cx="50" cy="138" r="8" 
          fill="currentColor" 
          style={{ opacity: isAnimating ? 0 : 1, transition: 'opacity 0.1s' }} 
        />
      </svg>
      <span 
        ref={dotRef}
        style={{ 
          position: 'absolute', 
          left: '50%', 
          bottom: '2%', // approx cy 138 in the viewbox
          width: '0.18em', 
          height: '0.18em', 
          backgroundColor: 'currentColor', 
          borderRadius: '50%', 
          transform: 'translate(-50%, 0)',
          opacity: isAnimating ? 1 : 0,
          pointerEvents: 'none'
        }} 
      />
      <span 
        ref={sparkleRef}
        style={{ 
          position: 'absolute', 
          left: '50%', 
          bottom: '2%', 
          transform: 'translate(-50%, 0)', 
          opacity: 0, 
          color: 'var(--accent)', 
          fontSize: '0.45em', 
          pointerEvents: 'none' 
        }}
      >
        ✦
      </span>
    </span>
  );
};

export const HeroPrompt: React.FC = () => {
  const resetIdleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'touchstart', 'mousedown', 'click'];
    const handleActivity = () => {
      if (resetIdleRef.current) resetIdleRef.current();
    };
    
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
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
          <AnimatedQuestionMark onIdleReset={(fn) => resetIdleRef.current = fn} />
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

