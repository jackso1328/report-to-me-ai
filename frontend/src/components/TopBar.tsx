import React, { useEffect, useState } from 'react';
import { Menu, User, Sun, Moon } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = (localStorage.getItem('app-theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.25rem 1.5rem',
      paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 50
    }}>
      <button 
        aria-label="Menu" 
        style={{ 
          padding: '8px', 
          color: 'var(--text-primary)',
          borderRadius: '50%'
        }}
      >
        <Menu size={24} strokeWidth={1.5} />
      </button>
      
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button 
          onClick={toggleTheme} 
          aria-label="Toggle Theme" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '8px 12px',
            borderRadius: '20px',
            backgroundColor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 500
          }}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={14} strokeWidth={2} style={{ color: '#f59e0b' }} />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={14} strokeWidth={2} style={{ color: '#3b82f6' }} />
              <span>Dark</span>
            </>
          )}
        </button>

        <button 
          aria-label="Profile" 
          style={{ 
            padding: '8px', 
            color: 'var(--text-primary)',
            borderRadius: '50%'
          }}
        >
          <User size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

