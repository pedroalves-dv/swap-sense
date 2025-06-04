import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import CurrencyConverter from './components/CurrencyConverter/CurrencyConverter';
import SpendingPower from './components/SpendingPower/SpendingPower';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import './styles/index.scss';

function Main() {
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [converterAmount, setConverterAmount] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(1);

  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <div className="currency-container">
          <CurrencyConverter
            setToCurrency={setToCurrency}
            amount={converterAmount}
            setAmount={setConverterAmount}
            setConvertedAmount={setConvertedAmount}
          />
        </div>
        <div className="spending-power-container">
          <SpendingPower
            currency={toCurrency}
            externalAmount={convertedAmount}
          />
        </div>
      </div>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
