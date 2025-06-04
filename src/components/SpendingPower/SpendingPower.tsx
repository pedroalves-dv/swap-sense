import React, { useState, useEffect } from 'react';
import costOfLivingData from '../../data/cost-of-living.json'; // Ensure correct path
import './SpendingPower.scss';

interface Purchase {
  category: string;
  description: string;
  icon: string;
  amount: number;
}

interface SpendingPowerProps {
  currency: string;
  externalAmount: number;
}

// Currency-to-country mapping
const currencyToCountryMap: { [key: string]: string } = {
  USD: 'United States',
  EUR: 'France',
  GBP: 'United Kingdom',
  JPY: 'Japan',
  AUD: 'Australia',
  CAD: 'Canada',
  INR: 'India',
  CNY: 'China',
  BRL: 'Brazil',
  ZAR: 'South Africa',
  CHF: 'Switzerland',
  BSD: 'Bahamas',
  ISK: 'Iceland',
  SGD: 'Singapore',
  BBD: 'Barbados',
  NOK: 'Norway',
  DKK: 'Denmark',
  HKD: 'Hong Kong (China)',
  AT: 'Austria',
  NZD: 'New Zealand',
  ILS: 'Israel',
  LUX: 'Luxembourg',
  DE: 'Germany',
  KRW: 'South Korea',
  SE: 'Sweden',
  IT: 'Italy',
  UAE: 'United Arab Emirates',
  CY: 'Cyprus',
  UY: 'Uruguay',
  JM: 'Jamaica',
  MT: 'Malta',
  TT: 'Trinidad And Tobago',
  CR: 'Costa Rica',
  BH: 'Bahrain',
  GR: 'Greece',
  EE: 'Estonia',
  QA: 'Qatar',
  SI: 'Slovenia',
  LV: 'Latvia',
  ES: 'Spain',
  LT: 'Lithuania',
  SK: 'Slovakia',
  CU: 'Cuba',
  CZ: 'Czech Republic',
  PA: 'Panama',
  JP: 'Japan',
  HR: 'Croatia',
  SA: 'Saudi Arabia',
  TW: 'Taiwan',
  PT: 'Portugal',
  OM: 'Oman',
  KW: 'Kuwait',
  AL: 'Albania',
  LB: 'Lebanon',
  HU: 'Hungary',
  PS: 'Palestine',
  JO: 'Jordan',
  AM: 'Armenia',
  PL: 'Poland',
  MXN: 'Mexico',
  SV: 'El Salvador',
  ME: 'Montenegro',
  CL: 'Chile',
  GT: 'Guatemala',
  VE: 'Venezuela',
  BG: 'Bulgaria',
  DO: 'Dominican Republic',
  RS: 'Serbia',
  RO: 'Romania',
  TR: 'Turkey',
  KH: 'Cambodia',
  CM: 'Cameroon',
  ZW: 'Zimbabwe',
  MU: 'Mauritius',
  FJ: 'Fiji',
  BA: 'Bosnia And Herzegovina',
  LK: 'Sri Lanka',
  ZA: 'South Africa',
  TH: 'Thailand',
  MD: 'Moldova',
  GE: 'Georgia',
  MK: 'North Macedonia',
  EC: 'Ecuador',
  KZ: 'Kazakhstan',
  CN: 'China',
  NG: 'Nigeria',
  AZ: 'Azerbaijan',
  PH: 'Philippines',
  RU: 'Russia',
  GH: 'Ghana',
  KE: 'Kenya',
  BW: 'Botswana',
  MY: 'Malaysia',
  PE: 'Peru',
  MA: 'Morocco',
  XK: 'Kosovo (Disputed Territory)',
  AR: 'Argentina',
  IQ: 'Iraq',
  UG: 'Uganda',
  DZ: 'Algeria',
  CO: 'Colombia',
  VN: 'Vietnam',
  TN: 'Tunisia',
  BO: 'Bolivia',
  KG: 'Kyrgyzstan',
  ID: 'Indonesia',
  IR: 'Iran',
  UZ: 'Uzbekistan',
  BY: 'Belarus',
  UA: 'Ukraine',
  NP: 'Nepal',
  PY: 'Paraguay',
  MG: 'Madagascar',
  SY: 'Syria',
  TZ: 'Tanzania',
  BD: 'Bangladesh',
  EG: 'Egypt',
  LY: 'Libya',
  PK: 'Pakistan',
};

const basePrices = {
  meal: 10,
  transport: 2,
  groceries: 100, // Weekly groceries
  rent: 1000, // Monthly rent
};
function SpendingPower({ currency, externalAmount }: SpendingPowerProps) {
  const [amount, setAmount] = useState<number>(100);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Find country based on selected currency
  const country = currencyToCountryMap[currency] || 'United States';

  useEffect(() => {
    setAmount(externalAmount);
  }, [externalAmount]);

  useEffect(() => {
    // Find country data with a flexible match
    const countryData = costOfLivingData.find(
      (item: { Country: string }) =>
        item.Country?.toLowerCase() === country.toLowerCase()
    );

    if (countryData) {
      const mealIndex = countryData['Restaurant Price Index'] || 10;
      const transportIndex = countryData['Cost of Living Index'] || 2;
      const groceriesIndex = countryData['Groceries Index'] || 1.5;
      const rentIndex = countryData['Rent Index'] || 1000;

      // Calculate actual prices using base prices and indices
      const mealPrice = (basePrices.meal * mealIndex) / 100;
      const transportPrice = (basePrices.transport * transportIndex) / 100;
      const groceriesPrice = (basePrices.groceries * groceriesIndex) / 100;
      const rentPrice = (basePrices.rent * rentIndex) / 100;

      // Update purchase data
      const purchaseData: Purchase[] = [
        {
          category: 'Meal',
          description: `With ${amount} ${currency}, you can get ${Math.floor(
            amount / mealPrice
          )} meals.`,
          icon: 'meal-icon.png',
          amount: mealPrice,
        },
        {
          category: 'Public Transport',
          description: `${amount} ${currency} equals ${Math.floor(
            amount / transportPrice
          )} one-way public transport tickets.`,
          icon: 'transport-icon.png',
          amount: transportPrice,
        },
        {
          category: 'Groceries',
          description: `${amount} ${currency} is enough to buy groceries for ${Math.floor(
            amount / groceriesPrice
          )} weeks.`,
          icon: 'groceries-icon.png',
          amount: groceriesPrice,
        },
        {
          category: 'Rent',
          description: `${amount} ${currency} is enough to pay rent for ${Math.floor(
            amount / rentPrice
          )} months.`,
          icon: 'rent-icon.png',
          amount: rentPrice,
        },
      ];

      setPurchases(purchaseData);
    } else {
      setPurchases([]); // If no data, reset purchases
    }
  }, [amount, currency, country]);

  return (
    <div className="spending-power">
      <h1>Spending Power</h1>
      <div className="balance">
        <div className="quick-conversion">
          <input
            type="range"
            min="1"
            max="1000"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
          />
          <p className="amount">
            {amount} {currency}
          </p>
        </div>
      </div>
      <div className="purchases">
        {purchases.length > 0 ? (
          purchases.map((purchase) => (
            <div key={purchase.category} className="purchase">
              <img src={purchase.icon} alt={purchase.category} />
              <p>{purchase.description}</p>
            </div>
          ))
        ) : (
          <p>No cost of living data available for {country}.</p>
        )}
      </div>
    </div>
  );
}

export default SpendingPower;
