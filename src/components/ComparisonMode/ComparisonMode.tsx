import React, { useState, useEffect, useMemo } from 'react';
import type { Currency } from '../../@types/currency';
import Skeleton from '../Skeleton/Skeleton';
import './ComparisonMode.scss';

interface ExchangeRate {
  [key: string]: number;
}

interface ComparisonCurrency {
  code: string;
  amount: number;
  percentDiff?: number;
}

const CACHE_KEY = 'swapsense-comparison-currencies';
const EXCHANGE_CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Popular currencies for comparison
const DEFAULT_COMPARISON: string[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

// Default fallback currencies
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MXN', name: 'Mexican Peso' },
];

function ComparisonMode() {
  const [baseAmount, setBaseAmount] = useState<string>('1000');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [comparisonCurrencies, setComparisonCurrencies] = useState<string[]>(
    []
  );
  const [availableCurrencies, setAvailableCurrencies] =
    useState<Currency[]>(DEFAULT_CURRENCIES);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load saved comparison currencies from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setComparisonCurrencies(parsed);
      } catch {
        setComparisonCurrencies(DEFAULT_COMPARISON);
      }
    } else {
      setComparisonCurrencies(DEFAULT_COMPARISON);
    }
  }, []);

  // Save comparison currencies to localStorage
  useEffect(() => {
    if (comparisonCurrencies.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(comparisonCurrencies));
    }
  }, [comparisonCurrencies]);

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('https://api.frankfurter.app/currencies');
        if (response.ok) {
          const data = await response.json();
          const currencies: Currency[] = Object.entries(data).map(
            ([code, name]) => ({
              code,
              name: name as string,
            })
          );
          setAvailableCurrencies(currencies);
        }
      } catch (error) {
        // Failed to fetch currencies, using defaults
      }
    };

    fetchCurrencies();
  }, []);

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      setIsLoading(true);

      // Check cache first
      const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp, base } = JSON.parse(cached);
          if (
            Date.now() - timestamp < CACHE_DURATION &&
            base === baseCurrency
          ) {
            setExchangeRates(data);
            setIsLoading(false);
            return;
          }
        } catch {
          // Invalid cache, continue to fetch
        }
      }

      // Fetch fresh rates
      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${baseCurrency}`
        );
        if (response.ok) {
          const data = await response.json();
          const rates = { ...data.rates, [baseCurrency]: 1 };
          setExchangeRates(rates);

          // Cache the results
          localStorage.setItem(
            EXCHANGE_CACHE_KEY,
            JSON.stringify({
              data: rates,
              timestamp: Date.now(),
              base: baseCurrency,
            })
          );
        }
      } catch (error) {
        // Failed to fetch exchange rates, will retry on next currency change
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [baseCurrency]);

  // Calculate comparison values
  const comparisonValues: ComparisonCurrency[] = useMemo(() => {
    const amount = parseFloat(baseAmount) || 0;
    const usdRate = exchangeRates.USD || 1;

    return comparisonCurrencies.map((code) => {
      const rate = exchangeRates[code] || 0;
      const convertedAmount = amount * rate;

      // Calculate percentage difference from USD baseline
      const usdEquivalent = amount * usdRate;
      const targetUsdEquivalent = convertedAmount / (exchangeRates.USD || 1);
      const percentDiff =
        usdEquivalent > 0
          ? ((targetUsdEquivalent - usdEquivalent) / usdEquivalent) * 100
          : 0;

      return {
        code,
        amount: convertedAmount,
        percentDiff: Math.abs(percentDiff) < 0.01 ? 0 : percentDiff,
      };
    });
  }, [baseAmount, comparisonCurrencies, exchangeRates]);

  const handleAddCurrency = (code: string) => {
    if (
      !comparisonCurrencies.includes(code) &&
      comparisonCurrencies.length < 8
    ) {
      setComparisonCurrencies([...comparisonCurrencies, code]);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    setComparisonCurrencies(comparisonCurrencies.filter((c) => c !== code));
  };

  const availableToAdd = availableCurrencies.filter(
    (c) => !comparisonCurrencies.includes(c.code) && c.code !== baseCurrency
  );

  return (
    <div className="comparison-mode">
      <div className="comparison-input">
        <div className="input-group">
          <label htmlFor="base-amount">Amount</label>
          <input
            id="base-amount"
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        <div className="input-group">
          <label htmlFor="base-currency">Base Currency</label>
          <select
            id="base-currency"
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
          >
            {availableCurrencies.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        <div className="add-currency">
          <label htmlFor="add-currency-select">Add Currency</label>
          <select
            id="add-currency-select"
            onChange={(e) => {
              if (e.target.value) {
                handleAddCurrency(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={comparisonCurrencies.length >= 8}
          >
            <option value="">Select to add...</option>
            {availableToAdd.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
          {comparisonCurrencies.length >= 8 && (
            <span className="limit-note">Maximum 8 currencies</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="comparison-grid">
          {['skel-1', 'skel-2', 'skel-3', 'skel-4'].map((key) => (
            <Skeleton
              key={key}
              width={220}
              height={120}
              style={{ margin: '1rem' }}
            />
          ))}
        </div>
      ) : (
        <div className="comparison-grid">
          {comparisonValues.map((item) => {
            const currency = availableCurrencies.find(
              (c) => c.code === item.code
            );
            const isPositive = (item.percentDiff || 0) >= 0;

            return (
              <div key={item.code} className="comparison-card">
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveCurrency(item.code)}
                  title="Remove currency"
                >
                  ×
                </button>

                <div className="currency-header">
                  <span className="currency-code">{item.code}</span>
                  <span className="currency-name">
                    {currency?.name || item.code}
                  </span>
                </div>

                <div className="converted-amount">
                  {item.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                {item.percentDiff !== 0 && (
                  <div
                    className={`percent-diff ${
                      isPositive ? 'positive' : 'negative'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {item.percentDiff?.toFixed(2)}%
                    <span className="vs-baseline">vs USD baseline</span>
                  </div>
                )}
              </div>
            );
          })}

          {comparisonValues.length === 0 && (
            <div className="empty-state">
              <p>No currencies selected for comparison</p>
              <p className="hint">Add currencies using the dropdown above</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComparisonMode;
