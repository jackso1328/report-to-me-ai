import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleDir: number;
  isTwinkling: boolean;
}

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let stars: Star[] = [];

    const initStars = () => {
      stars = [];
      // Sparse distribution: 1 star per 5500 square pixels
      const numStars = Math.floor((window.innerWidth * window.innerHeight) / 5500);
      
      for (let i = 0; i < numStars; i++) {
        const size = Math.random() * 1.2 + 0.4;
        const baseOpacity = Math.random() * 0.55 + 0.15;
        // Parallax depth: larger stars move slightly faster
        const speed = prefersReducedMotion ? 0 : (size / 1.6) * 0.08 + 0.02;

        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size,
          speed,
          opacity: baseOpacity,
          baseOpacity,
          twinkleSpeed: prefersReducedMotion ? 0 : Math.random() * 0.008 + 0.002,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
          isTwinkling: Math.random() > 0.4 // Only ~60% twinkle for calm aesthetics
        });
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      // Soft color definitions for white/gray in dark theme, dark slate in light theme
      const starRGB = isLight ? '15, 23, 42' : '255, 255, 255';

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starRGB}, ${star.opacity})`;
        ctx.fill();

        if (!prefersReducedMotion) {
          // Extremely slow upward drift
          star.y -= star.speed;
          if (star.y < 0) {
            star.y = canvas.height;
            star.x = Math.random() * canvas.width;
          }

          // Subtle twinkling
          if (star.isTwinkling) {
            star.opacity += star.twinkleSpeed * star.twinkleDir;
            if (star.opacity >= Math.min(1, star.baseOpacity + 0.3)) {
              star.opacity = Math.min(1, star.baseOpacity + 0.3);
              star.twinkleDir = -1;
            } else if (star.opacity <= Math.max(0.08, star.baseOpacity - 0.25)) {
              star.opacity = Math.max(0.08, star.baseOpacity - 0.25);
              star.twinkleDir = 1;
            }
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

