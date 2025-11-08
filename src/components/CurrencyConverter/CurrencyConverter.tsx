import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import FavoriteCurrencies from '../FavoriteCurrencies/FavoriteCurrencies';
import logo from '../../assets/logo.png';
import type { Currency } from '../../@types/currency';
import { getCachedData, setCachedData } from '../../utils/cache';
import Skeleton from '../Skeleton/Skeleton';
import './CurrencyConverter.scss';

interface CurrencyConverterProps {
  setToCurrency: (currency: string) => void;
  amount: number;
  setAmount: (amount: number) => void;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  CURRENCIES: 'currency_list_cache',
  EXCHANGE_RATES: 'exchange_rates_cache',
};

// Default fallback currencies
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
];

function CurrencyConverter({
  setToCurrency,
  amount,
  setAmount,
}: CurrencyConverterProps) {
  const [displayAmount, setDisplayAmount] = useState<string>('1');
  const [fromCurrency, setFromCurrency] = useState<string>('EUR');
  const [toCurrency, setToCurrencyState] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState<boolean>(false);
  const [loadingRate, setLoadingRate] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [animatedString, setAnimatedString] = useState('');

  // Memoize loading state - true if either is loading
  const loading = useMemo(
    () => loadingCurrencies || loadingRate,
    [loadingCurrencies, loadingRate]
  );

  // Fetch currencies list on mount (with caching)
  useEffect(() => {
    const fetchCurrencies = async () => {
      // Check cache first
      const cached = getCachedData<Currency[]>(CACHE_KEYS.CURRENCIES);
      if (cached) {
        setCurrencies(cached);
        return;
      }

      try {
        setLoadingCurrencies(true);
        const response = await fetch(
          'https://openexchangerates.org/api/currencies.json'
        );
        if (!response.ok) throw new Error('Failed to fetch currencies');
        const data = await response.json();
        const currencyList = Object.keys(data).map((code) => ({
          code,
          name: data[code],
        }));
        setCurrencies(currencyList);
        setCachedData(CACHE_KEYS.CURRENCIES, currencyList);
      } catch (err) {
        setError('Failed to load currencies. Using default list.');
        setCurrencies(DEFAULT_CURRENCIES);
      } finally {
        setLoadingCurrencies(false);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch exchange rates when currencies change (with debounce and caching)
  useEffect(() => {
    const cacheKey = `${CACHE_KEYS.EXCHANGE_RATES}_${fromCurrency}`;

    const fetchExchangeRate = async () => {
      // Check cache first
      const cached = getCachedData<{ [key: string]: number }>(cacheKey);
      if (cached && cached[toCurrency]) {
        setExchangeRate(cached[toCurrency]);
        return;
      }

      try {
        setLoadingRate(true);
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
        );
        if (!response.ok) throw new Error('Failed to fetch exchange rate');
        const data = await response.json();

        // Cache all rates for this base currency
        setCachedData(cacheKey, data.rates);
        setExchangeRate(data.rates[toCurrency]);

        // Clear error only if successful
        if (error) setError(null);
      } catch (err) {
        setError('Failed to fetch exchange rate. Please try again.');
      } finally {
        setLoadingRate(false);
      }
    };

    if (fromCurrency && toCurrency) {
      // Debounce API calls to avoid rapid-fire requests
      const debounceTimer = setTimeout(() => {
        fetchExchangeRate();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }

    return () => {};
  }, [fromCurrency, toCurrency, error]);

  const swapCurrencies = useCallback(() => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrencyState(temp);
    setToCurrency(temp);
  }, [fromCurrency, toCurrency, setToCurrency]);

  const handleToCurrencyChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newToCurrency = e.target.value;
      setToCurrencyState(newToCurrency);
      setToCurrency(newToCurrency);
    },
    [setToCurrency]
  );

  // Format number with spaces for readability
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
      .format(num)
      .replace(/,/g, ' ');
  }, []);

  // Update displayAmount when amount changes from outside (e.g., slider)
  useEffect(() => {
    setDisplayAmount(formatNumber(amount));
  }, [amount, formatNumber]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cursorPosition = e.target.selectionStart || 0;
      let value = e.target.value.replace(/\s/g, '');

      if (value.length > 12) {
        value = value.slice(0, 12);
      }

      const numericValue = parseFloat(value);
      if (!Number.isNaN(numericValue)) {
        setAmount(numericValue);
        const formatted = formatNumber(numericValue);
        setDisplayAmount(formatted);

        // Restore cursor position after formatting
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const oldLength = e.target.value.length;
            const newLength = formatted.length;
            const diff = newLength - oldLength;
            const newPosition = Math.max(0, cursorPosition + diff);
            inputRef.current.setSelectionRange(newPosition, newPosition);
          }
        });
      } else if (value === '') {
        setAmount(0);
        setDisplayAmount('');
      }
    },
    [setAmount, formatNumber]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        swapCurrencies();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAmount(0);
        setDisplayAmount('');
        inputRef.current?.blur();
      }
    },
    [swapCurrencies, setAmount]
  );

  // Smooth animation for result display
  useEffect(() => {
    const finalString = formatNumber(amount * exchangeRate);
    setAnimatedString(finalString);
  }, [amount, exchangeRate, formatNumber]);

  // Removed setConvertedAmount effect

  return (
    <div className="currency-converter">
      {error && <div className="error-message">{error}</div>}

      <FavoriteCurrencies
        onSelectPair={(from, to) => {
          setFromCurrency(from);
          setToCurrencyState(to);
          setToCurrency(to);
        }}
        currentFrom={fromCurrency}
        currentTo={toCurrency}
      />

      <div className="converter-form">
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          onKeyDown={handleKeyDown}
          ref={inputRef}
          disabled={loading}
          placeholder="Enter amount"
          aria-label="Amount to convert"
          inputMode="decimal"
        />
        <select
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
          disabled={loading}
          aria-label="Convert from currency"
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
            disabled={loading}
            aria-label="Swap currencies (Press Enter)"
            title="Swap currencies (Enter)"
          >
            <img src={logo} alt="Swap" className="swap-icon" />
          </button>
        </div>
        <select
          value={toCurrency}
          onChange={handleToCurrencyChange}
          disabled={loading}
          aria-label="Convert to currency"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name}
            </option>
          ))}
        </select>

        <div className="result" aria-live="polite" aria-atomic="true">
          {loading ? (
            <Skeleton width={120} height={24} />
          ) : (
            `${animatedString} ${toCurrency}`
          )}
        </div>
      </div>
    </div>
  );
}

export default CurrencyConverter;
