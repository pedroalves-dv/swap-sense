import React, { useState, useEffect } from 'react';
import './Header.scss';
import logo from '../../assets/logo.png';

function Header() {
  const [lightMode, setLightMode] = useState(true);

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add('light-mode');
      document.querySelector('.header')?.classList.add('light-mode');
      document.querySelector('.footer')?.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.querySelector('.header')?.classList.remove('light-mode');
      document.querySelector('.footer')?.classList.remove('light-mode');
    }
  }, [lightMode]);

  const toggleLightMode = () => {
    setLightMode(!lightMode);
  };
  return (
    <div className="header">
      <p className="title">
        {/* <span className="logo">🌐︎</span> */}
        <span className="logo">
          <img
            src={logo}
            style={{ width: '26px', height: '26px' }}
            alt="logo"
          />
        </span>
      </p>
      <button
        type="button"
        onClick={toggleLightMode}
        className={`dark-mode-toggle ${lightMode ? 'active' : ''}`}
        aria-label="Toggle Light Mode"
      />
    </div>
  );
}

export default Header;
