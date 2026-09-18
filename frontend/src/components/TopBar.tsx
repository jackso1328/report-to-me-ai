import React, { useEffect, useState } from 'react';
import { Menu, User } from 'lucide-react';

export const TopBar: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    setTheme(savedTheme as 'light' | 'dark');
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
      padding: '1.5rem',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 50
    }}>
      <button aria-label="Menu" style={{ padding: '8px' }}>
        <Menu size={28} strokeWidth={1.5} />
      </button>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button onClick={toggleTheme} aria-label="Toggle Theme" style={{
          fontSize: '0.8rem',
          opacity: 0.6,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {theme}
        </button>
        <button aria-label="Profile" style={{ padding: '8px' }}>
          <User size={28} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
