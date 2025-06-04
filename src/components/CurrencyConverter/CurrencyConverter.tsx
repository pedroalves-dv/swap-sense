import React, { useState, useEffect, useRef } from 'react';
import './CurrencyConverter.scss';

interface Currency {
  code: string;
  name: string;
}

interface CurrencyConverterProps {
  setToCurrency: (currency: string) => void;
  amount: number;
  setAmount: (amount: number) => void;
  setConvertedAmount: (amount: number) => void;
}

function CurrencyConverter({
  setToCurrency,
  amount,
  setAmount,
  setConvertedAmount,
}: CurrencyConverterProps) {
  // const [amount, setAmount] = useState<number>(1);
  const [displayAmount, setDisplayAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrencyState] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [animatedString, setAnimatedString] = useState('');

  useEffect(() => {
    fetch('https://openexchangerates.org/api/currencies.json')
      .then((response) => response.json())
      .then((data) => {
        const currencyList = Object.keys(data).map((code) => ({
          code,
          name: data[code],
        }));
        setCurrencies(currencyList);
      });

    fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      .then((response) => response.json())
      .then((data) => {
        setExchangeRate(data.rates[toCurrency]);
      });
  }, [fromCurrency, toCurrency]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrencyState(fromCurrency);
    setToCurrency(fromCurrency);
  };

  const handleToCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newToCurrency = e.target.value;
    setToCurrencyState(newToCurrency);
    setToCurrency(newToCurrency);
  };

  // formating of the numbers with spaces for readability
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
      .format(num)
      .replace(/,/g, ' ');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 12) {
      value = value.slice(0, 12);
    }
    const numericValue = parseFloat(value);
    if (!Number.isNaN(numericValue)) {
      setAmount(numericValue);
      setDisplayAmount(formatNumber(numericValue));
    } else {
      setDisplayAmount(e.target.value);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart;
      setDisplayAmount(formatNumber(amount));
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [amount]);

  useEffect(() => {
    // Convert final numeric value to a string
    const finalString = formatNumber(amount * exchangeRate);

    // Clear any previous animation
    let index = 0;
    let partial = '';
    setAnimatedString('');

    let isMounted = true;

    const intervalId = setInterval(() => {
      if (!isMounted) return;
      // Build up the final string one character at a time
      partial += finalString[index];
      setAnimatedString(partial);
      index += 1;

      // Stop once we've revealed the entire string
      if (index >= finalString.length) {
        clearInterval(intervalId);
      }
    }, 40); // Adjust for speed

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [amount, exchangeRate]);

  useEffect(() => {
    const converted = Math.floor(amount * exchangeRate); // round down
    setConvertedAmount(converted);
  }, [amount, exchangeRate, setConvertedAmount]);

  return (
    <div className="currency-converter">
      <div className="converter-form">
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          ref={inputRef}
        />
        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>
        <div className="buttons">
          <button
            type="button"
            className="swap-button"
            onClick={swapCurrencies}
          >
            ⇄
          </button>
          {/* <button type="button" className="convert-button" onClick={convert}>
            Convert
          </button> */}
        </div>
        <select value={toCurrency} onChange={handleToCurrencyChange}>
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>

        <div className="result">
          {animatedString} {toCurrency}
        </div>
      </div>
    </div>
  );
}

export default CurrencyConverter;
