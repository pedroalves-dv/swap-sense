import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import CurrencyConverter from './components/CurrencyConverter/CurrencyConverter';
import ComparisonMode from './components/ComparisonMode/ComparisonMode';
import SpendingPower from './components/SpendingPower/SpendingPower';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import './styles/index.scss';

type AppMode = 'convert' | 'compare';

function Main() {
  const [mode, setMode] = useState<AppMode>('convert');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<number>(1);
  // Removed unused convertedAmount state

  return (
    <div className="app">
      <Header mode={mode} setMode={setMode} />

      <main className="main-content">
        <div className="modules-container">
          {mode === 'convert' ? (
            <>
              <div className="module-card">
                <CurrencyConverter
                  setToCurrency={setToCurrency}
                  amount={amount}
                  setAmount={setAmount}
                />
              </div>

              <div className="module-card">
                <SpendingPower
                  currency={toCurrency}
                  amount={amount}
                  setAmount={setAmount}
                />
              </div>
            </>
          ) : (
            <div className="module-card full-width">
              <ComparisonMode />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Main />
    </ErrorBoundary>
  </React.StrictMode>
);
