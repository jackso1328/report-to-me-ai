import React, { useState, useEffect, useRef } from 'react';

export const HeroPrompt: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const qContainerRef = useRef<HTMLSpanElement>(null);
  const qBodyRef = useRef<HTMLSpanElement>(null);
  const qDotRef = useRef<HTMLSpanElement>(null);
  const qSparkleRef = useRef<HTMLSpanElement>(null);
  const cancelAnimRef = useRef(false);

  useEffect(() => {
    let idleTimer: number;

    const resetIdleTimer = () => {
      setIsAnimating(false);
      cancelAnimRef.current = true;
      clearTimeout(idleTimer);

      const delay = 30000;
      
      idleTimer = window.setTimeout(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
           resetIdleTimer();
           return;
        }
        setIsAnimating(true);
      }, delay);
    };

    resetIdleTimer();

    const events = ['mousemove', 'keydown', 'touchstart', 'mousedown', 'click'];
    const handleActivity = () => resetIdleTimer();
    
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      clearTimeout(idleTimer);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, []);

  useEffect(() => {
    if (!isAnimating) return;
    cancelAnimRef.current = false;

    const seqTimeout = setTimeout(() => {
       runAnimationSequence();
    }, 50);

    return () => clearTimeout(seqTimeout);
  }, [isAnimating]);

  const runAnimationSequence = async () => {
    if (!qContainerRef.current || !qBodyRef.current || !qDotRef.current || !qSparkleRef.current) return;

    const rect = qContainerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minDist = Math.min(vw, vh) * 0.25;

    let targetX = 0;
    let targetY = 0;

    for (let i = 0; i < 30; i++) {
      const rx = vw * 0.1 + Math.random() * (vw * 0.8);
      const ry = vh * 0.15 + Math.random() * (vh * 0.55);
      
      const dx = rx - (rect.left + rect.width / 2);
      const dy = ry - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist >= minDist) {
        targetX = dx;
        targetY = dy;
        break;
      }
    }
    
    if (targetX === 0 && targetY === 0) {
      targetX = minDist;
      targetY = -minDist;
    }

    const dot = qDotRef.current;
    const body = qBodyRef.current;
    const sparkle = qSparkleRef.current;

    const checkCancel = () => cancelAnimRef.current;
    const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

    const animatePath = (
      el: HTMLElement,
      startX: number, startY: number,
      endX: number, endY: number,
      durationMs: number,
      isReturn: boolean
    ): Promise<void> => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        const mx = (startX + endX) / 2;
        const my = (startY + endY) / 2;
        const dx = endX - startX;
        const dy = endY - startY;
        
        const px = isReturn ? dy * 0.2 : -dy * 0.2; 
        const py = isReturn ? -dx * 0.2 : dx * 0.2;
        const cx = mx + px;
        const cy = my + py;

        const step = (time: number) => {
          if (checkCancel()) { resolve(); return; }
          let p = (time - startTime) / durationMs;
          if (p > 1) p = 1;

          const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
          
          const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX;
          const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY;
          
          const rot = (x - startX) * 0.05;
          el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
          
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    };

    dot.style.transition = 'transform 1s cubic-bezier(0.2, 0, 0.2, 1), filter 1s ease';
    dot.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.85) rotate(45deg)`;
    dot.style.filter = 'brightness(1.5)';
    
    await wait(1000);
    if (checkCancel()) return;

    dot.style.transition = 'transform 4s ease-in-out';
    dot.style.transform = `translate(${targetX}px, ${targetY - 10}px) scale(0.85) rotate(60deg)`;
    
    body.classList.add('anim-q-body-search');
    await wait(2000);
    if (checkCancel()) return;
    body.classList.remove('anim-q-body-search');

    const dist = Math.sqrt(targetX * targetX + targetY * targetY);
    const travelDur = Math.min(Math.max(dist / 200 * 1000, 1200), 2400);

    body.style.transition = 'none';
    await animatePath(body, 0, 0, targetX, targetY, travelDur, false);
    if (checkCancel()) return;

    sparkle.style.transition = 'none';
    sparkle.style.opacity = '1';
    sparkle.style.transform = `translate(${targetX + 15}px, ${targetY - 15}px) scale(1.2)`;
    
    dot.style.transition = 'filter 0.3s ease';
    dot.style.filter = 'brightness(2.5)';
    body.style.filter = 'brightness(1.5)';
    
    await wait(400);
    if (checkCancel()) return;

    sparkle.style.transition = 'opacity 0.3s ease';
    sparkle.style.opacity = '0';
    
    const returnDur = Math.min(Math.max(dist / 200 * 1000, 1500), 2500);
    body.style.transition = 'none';
    dot.style.transition = 'none';
    
    const p1 = animatePath(body, targetX, targetY, 0, 0, returnDur, true);
    const p2 = animatePath(dot, targetX, targetY, 0, 0, returnDur, true);
    
    await Promise.all([p1, p2]);
    if (checkCancel()) return;

    body.style.filter = '';
    dot.style.filter = '';
    body.style.transform = '';
    dot.style.transform = '';
    
    await wait(200);
    if (checkCancel()) return;
    
    setIsAnimating(false);
    window.dispatchEvent(new Event('mousemove'));
  };

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
            ref={qContainerRef}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <span className={isAnimating ? 'text-transparent' : ''}>?</span>
            
            {isAnimating && (
              <>
                <span 
                  ref={qBodyRef}
                  className="anim-q-body" 
                  aria-hidden="true" 
                  style={{ position: 'absolute', top: 0, left: 0, clipPath: 'polygon(0 0, 100% 0, 100% 82%, 0 82%)' }}
                >?</span>
                <span 
                  ref={qDotRef}
                  className="anim-q-dot" 
                  aria-hidden="true" 
                  style={{ position: 'absolute', top: 0, left: 0, clipPath: 'polygon(0 82%, 100% 82%, 100% 100%, 0 100%)' }}
                >?</span>
                <span 
                  ref={qSparkleRef}
                  className="anim-q-sparkle" 
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 0, left: 0, fontSize: '0.45em', color: 'var(--accent)', opacity: 0, pointerEvents: 'none' }}
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

