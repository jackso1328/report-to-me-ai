import React, { useEffect, useState, useRef } from 'react';
import { User, Sun, Moon, LogIn, Settings, Info, X, ShieldAlert, Home } from 'lucide-react';

interface TopBarProps {
  onNavigateHome?: () => void;
  onNavigateReview?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigateHome, onNavigateReview }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthPlaceholder, setShowAuthPlaceholder] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('app-theme') as 'light' | 'dark') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowAuthPlaceholder(false);
      }
    };
    
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    if (menuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSignInClick = () => {
    setMenuOpen(false);
    setShowAuthPlaceholder(true);
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.85rem 1rem',
    textAlign: 'left',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    borderRadius: '8px',
    cursor: 'pointer'
  };

  return (
    <>
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
          className="icon-button"
          aria-label="Home" 
          onClick={onNavigateHome}
          style={{ 
            padding: '8px', 
            color: 'var(--text-primary)',
            borderRadius: '50%'
          }}
        >
          <Home size={24} strokeWidth={1.5} />
        </button>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="pill-button"
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

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button 
              className="icon-button"
              aria-label="Profile" 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ 
                padding: '8px', 
                color: menuOpen ? 'var(--accent)' : 'var(--text-primary)',
                borderRadius: '50%'
              }}
            >
              <User size={24} strokeWidth={1.5} />
            </button>

            {menuOpen && (
              <div className="animate-fade-in" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '0.5rem',
                minWidth: '200px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <button className="menu-item" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                  <User size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                  Profile
                </button>
                <button className="menu-item" style={menuItemStyle} onClick={handleSignInClick}>
                  <LogIn size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                  Sign In
                </button>
                <button className="menu-item" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                  <Settings size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                  Settings
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                <button className="menu-item" style={menuItemStyle} onClick={() => {
                  setMenuOpen(false);
                  onNavigateReview?.();
                }}>
                  <ShieldAlert size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                  Review Queue
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                <button className="menu-item" style={menuItemStyle} onClick={() => setMenuOpen(false)}>
                  <Info size={18} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />
                  About
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuthPlaceholder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="animate-slide-up" style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)'
          }}>
            <button 
              onClick={() => setShowAuthPlaceholder(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '8px',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              backgroundColor: 'var(--glass-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: 'var(--accent)'
            }}>
              <LogIn size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Authentication coming soon
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              This is a development placeholder. Authentication infrastructure will be connected in a future milestone.
            </p>
            <button 
              onClick={() => setShowAuthPlaceholder(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
};

