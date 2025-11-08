import './Footer.scss';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer">
      <p className="title">© SwapSense {currentYear}</p>

      <div className="footer-center">
        <a
          className="footer-github"
          href="https://github.com/pedroalves-dv/global-exchange-tool"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="SwapSense on GitHub"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.11.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.33-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.654 1.653.243 2.874.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.805 5.62-5.476 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.903-.015 3.297 0 .32.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>

      <p className="author">v1.0.0</p>
    </div>
  );
}

export default Footer;
