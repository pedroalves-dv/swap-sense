import React, { useState, useEffect, useCallback } from 'react';
import './Header.scss';
import logo from '../../assets/logo.png';

type AppMode = 'convert' | 'compare';

interface HeaderProps {
  mode?: AppMode;
  setMode?: (mode: AppMode) => void;
}

function Header({ mode = 'convert', setMode }: HeaderProps) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('swapsense-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('swapsense-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
      localStorage.setItem('swapsense-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return (
    <header className="header">
      <div className="header-brand">
        <img src={logo} alt="Logo" className="header-logo" />
        <h1 className="header-title">SwapSense</h1>
      </div>

      <div className="header-controls">
        {setMode && (
          <div className="mode-toggle">
            <button
              type="button"
              onClick={() => setMode('convert')}
              className={`mode-btn ${mode === 'convert' ? 'active' : ''}`}
              aria-label="Convert mode"
            >
              Convert
            </button>
            <button
              type="button"
              onClick={() => setMode('compare')}
              className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
              aria-label="Compare mode"
            >
              Compare
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <div className={`toggle-switch ${isDark ? 'active' : ''}`}>
            <div className="toggle-slider" />
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
