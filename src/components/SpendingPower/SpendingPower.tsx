import React, { useState, useEffect, useMemo, useCallback } from 'react';
import costOfLivingData from '../../data/cost-of-living.json';
import './SpendingPower.scss';

interface SpendingPowerProps {
  currency: string;
  amount: number;
  setAmount: (amount: number) => void;
}

interface CostOfLivingItem {
  Country: string;
  'Restaurant Price Index': number;
  'Cost of Living Index': number;
  'Groceries Index': number;
  'Rent Index': number;
  'Local Purchasing Power Index': number;
}

interface PurchaseCategory {
  id: string;
  category: string;
  description: string;
  icon: string;
  emoji: string;
  amount: number;
  quantity: number;
}

// Improved currency-to-country mapping (defaults to most populous country using that currency)
const currencyToCountryMap: { [key: string]: string } = {
  // Major currencies
  USD: 'United States',
  EUR: 'Germany', // Largest Eurozone economy
  GBP: 'United Kingdom',
  JPY: 'Japan',
  CNY: 'China',
  CHF: 'Switzerland',
  CAD: 'Canada',
  AUD: 'Australia',
  NZD: 'New Zealand',

  // Asian currencies
  INR: 'India',
  KRW: 'South Korea',
  SGD: 'Singapore',
  HKD: 'Hong Kong (China)',
  THB: 'Thailand',
  MYR: 'Malaysia',
  PHP: 'Philippines',
  IDR: 'Indonesia',
  VND: 'Vietnam',
  TWD: 'Taiwan',

  // Middle Eastern currencies
  AED: 'United Arab Emirates',
  SAR: 'Saudi Arabia',
  ILS: 'Israel',
  QAR: 'Qatar',
  KWD: 'Kuwait',
  BHD: 'Bahrain',
  OMR: 'Oman',
  JOD: 'Jordan',

  // Latin American currencies
  BRL: 'Brazil',
  MXN: 'Mexico',
  ARS: 'Argentina',
  CLP: 'Chile',
  COP: 'Colombia',
  PEN: 'Peru',

  // African currencies
  ZAR: 'South Africa',
  EGP: 'Egypt',
  NGN: 'Nigeria',
  KES: 'Kenya',

  // Eastern European currencies
  RUB: 'Russia',
  PLN: 'Poland',
  CZK: 'Czech Republic',
  HUF: 'Hungary',
  RON: 'Romania',

  // Nordic currencies
  SEK: 'Sweden',
  NOK: 'Norway',
  DKK: 'Denmark',
  ISK: 'Iceland',

  // Other currencies
  TRY: 'Turkey',
  UAH: 'Ukraine',
  PKR: 'Pakistan',
  BDT: 'Bangladesh',
  NPR: 'Nepal',
  LKR: 'Sri Lanka',
};

// More realistic base prices (USD equivalent for a meal in an inexpensive restaurant)
const basePrices = {
  meal: 12, // Meal at inexpensive restaurant
  transport: 2.5, // One-way public transport ticket
  groceries: 60, // Weekly groceries for one person
  rent: 800, // Monthly 1-bedroom apartment in city center
  coffee: 3.5, // Cappuccino
  gym: 40, // Monthly gym membership
  utilities: 150, // Monthly utilities (electricity, heating, water, garbage)
  internet: 50, // Monthly internet
};

function SpendingPower({ currency, amount, setAmount }: SpendingPowerProps) {
  // amount and setAmount are now props from parent
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['meal', 'transport', 'groceries', 'rent'])
  );

  // Try to load an updatable data file from public/ at runtime.
  // This lets you replace `public/data/cost-of-living.json` without rebuilding.
  const [fetchedCostOfLiving, setFetchedCostOfLiving] = useState<
    CostOfLivingItem[] | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    // Use Vite's BASE_URL so the request works both in dev ("/") and when the
    // app is served from a subpath (e.g. GitHub Pages project site).
    fetch(`${import.meta.env.BASE_URL}data/cost-of-living.json`)
      .then((r) => {
        if (!r.ok) throw new Error('no public COL file');
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setFetchedCostOfLiving(data);
      })
      .catch(() => {
        // ignore - we'll fall back to the bundled JSON
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Use the fetched data if available, otherwise fall back to the bundled JSON.
  const costData: CostOfLivingItem[] =
    fetchedCostOfLiving ?? (costOfLivingData as CostOfLivingItem[]);

  // Memoize country lookup with fallback
  const country = useMemo(() => {
    const mapped = currencyToCountryMap[currency];
    if (mapped) return mapped;

    // Fallback: try to find a country that uses this currency in our data
    const found = costData.find((item) =>
      item.Country?.toLowerCase().includes(currency.toLowerCase())
    );

    return found?.Country || 'United States';
  }, [currency, costData]);

  // No need to sync with externalAmount, amount is now always controlled by parent

  // Find country data with better error handling
  const countryData = useMemo(() => {
    return costData.find(
      (item) => item.Country?.toLowerCase() === country.toLowerCase()
    );
  }, [country, costData]);

  // Memoize all purchase categories
  const allPurchases = useMemo((): PurchaseCategory[] => {
    if (!countryData) return [];

    const mealIndex = countryData['Restaurant Price Index'] || 50;
    const transportIndex = countryData['Cost of Living Index'] || 50;
    const groceriesIndex = countryData['Groceries Index'] || 50;
    const rentIndex = countryData['Rent Index'] || 50;

    const mealPrice = (basePrices.meal * mealIndex) / 100;
    const transportPrice = (basePrices.transport * transportIndex) / 100;
    const groceriesPrice = (basePrices.groceries * groceriesIndex) / 100;
    const rentPrice = (basePrices.rent * rentIndex) / 100;
    const coffeePrice = (basePrices.coffee * mealIndex) / 100;
    const gymPrice = (basePrices.gym * transportIndex) / 100;
    const utilitiesPrice = (basePrices.utilities * transportIndex) / 100;
    const internetPrice = (basePrices.internet * transportIndex) / 100;

    return [
      {
        id: 'meal',
        category: 'Meals',
        description: `restaurant meals`,
        icon: 'meal-icon.png',
        emoji: '🍽️',
        amount: mealPrice,
        quantity: Math.floor(amount / mealPrice),
      },
      {
        id: 'transport',
        category: 'Transport',
        description: `public transport tickets`,
        icon: 'transport-icon.png',
        emoji: '🚇',
        amount: transportPrice,
        quantity: Math.floor(amount / transportPrice),
      },
      {
        id: 'groceries',
        category: 'Groceries',
        description: `weeks of groceries`,
        icon: 'groceries-icon.png',
        emoji: '🛒',
        amount: groceriesPrice,
        quantity: Math.floor(amount / groceriesPrice),
      },
      {
        id: 'rent',
        category: 'Rent',
        description: `months of rent`,
        icon: 'rent-icon.png',
        emoji: '🏠',
        amount: rentPrice,
        quantity: Math.floor(amount / rentPrice),
      },
      {
        id: 'coffee',
        category: 'Coffee',
        description: `cappuccinos`,
        icon: 'coffee-icon.png',
        emoji: '☕',
        amount: coffeePrice,
        quantity: Math.floor(amount / coffeePrice),
      },
      {
        id: 'gym',
        category: 'Gym',
        description: `months of gym membership`,
        icon: 'gym-icon.png',
        emoji: '💪',
        amount: gymPrice,
        quantity: Math.floor(amount / gymPrice),
      },
      {
        id: 'utilities',
        category: 'Utilities',
        description: `months of utilities`,
        icon: 'utilities-icon.png',
        emoji: '💡',
        amount: utilitiesPrice,
        quantity: Math.floor(amount / utilitiesPrice),
      },
      {
        id: 'internet',
        category: 'Internet',
        description: `months of internet`,
        icon: 'internet-icon.png',
        emoji: '🌐',
        amount: internetPrice,
        quantity: Math.floor(amount / internetPrice),
      },
    ];
  }, [amount, countryData]);

  // Filter purchases based on selected categories
  const displayedPurchases = useMemo(() => {
    return allPurchases.filter((p) => selectedCategories.has(p.id));
  }, [allPurchases, selectedCategories]);

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(parseFloat(e.target.value));
    },
    [setAmount]
  );

  // Slider range bounds
  const SLIDER_MIN = 1;
  const SLIDER_MAX = 5000;
  const sliderPercent = Math.max(
    0,
    Math.min(100, ((amount - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100)
  );

  const sliderStyle = {
    ['--slider-progress' as unknown as string]: `${sliderPercent}%`,
  } as unknown as React.CSSProperties;

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        // Keep at least one category selected
        if (newSet.size > 1) {
          newSet.delete(categoryId);
        }
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const localPurchasingPower =
    countryData?.['Local Purchasing Power Index'] || 50;

  const getPowerClass = () => {
    if (localPurchasingPower > 70) return 'high';
    if (localPurchasingPower > 40) return 'medium';
    return 'low';
  };

  return (
    <div className="spending-power">
      <div className="header-section">
        <h1>Spending Power in {country}</h1>
        {countryData && (
          <div className="power-indicator">
            <span className="label">Purchasing Power:</span>
            <span className={`value ${getPowerClass()}`}>
              {localPurchasingPower.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="balance">
        <div className="quick-conversion">
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={10}
            value={amount}
            onChange={handleRangeChange}
            aria-label="Amount slider"
            aria-valuemin={SLIDER_MIN}
            aria-valuemax={SLIDER_MAX}
            style={sliderStyle}
          />
          <p className="amount">
            {amount.toLocaleString()} {currency}
          </p>
        </div>
      </div>

      {!countryData && (
        <div className="no-data-message">
          <p>⚠️ No cost of living data available for {country}.</p>
          <p className="hint">Showing estimates based on global averages.</p>
        </div>
      )}

      <div className="category-filters">
        {allPurchases.map((purchase) => {
          const isActive = selectedCategories.has(purchase.id);
          return (
            <button
              key={purchase.id}
              type="button"
              className={`category-filter ${isActive ? 'active' : ''}`}
              onClick={() => toggleCategory(purchase.id)}
              aria-pressed={isActive}
            >
              <span className="emoji">{purchase.emoji}</span>
              <span className="name">{purchase.category}</span>
            </button>
          );
        })}
      </div>

      <div className="purchases">
        {displayedPurchases.map((purchase) => (
          <div key={purchase.id} className="purchase">
            <span className="emoji-large">{purchase.emoji}</span>
            <div className="purchase-info">
              <div className="purchase-quantity">
                <span className="number">
                  {purchase.quantity.toLocaleString()}
                </span>
                <span className="description">{purchase.description}</span>
              </div>
              <div className="purchase-price">
                <span className="price-label">
                  ≈ {purchase.amount.toFixed(2)} {currency} each
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpendingPower;
