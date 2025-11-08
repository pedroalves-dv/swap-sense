import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load local environment variables from .env.local (if present)
dotenv.config({ path: '.env.local' });

// This script fetches a cost-of-living dataset from a URL (RapidAPI or other)
// and writes a normalized file to public/data/cost-of-living.json
// Usage (locally):
//   SOURCE_URL="https://api..." RAPIDAPI_KEY=key RAPIDAPI_HOST=host node scripts/update-cost-of-living.js

const OUT = path.resolve('./public/data/cost-of-living.json');
const SOURCE_URL = process.env.SOURCE_URL || process.env.RAPIDAPI_URL;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

// Optional: explicit RapidAPI endpoints (allow {country} and {city_id} placeholders)
const RAPIDAPI_CITIES_URL = process.env.RAPIDAPI_CITIES_URL; // e.g. https://.../cities?country={country}
const RAPIDAPI_PRICES_URL = process.env.RAPIDAPI_PRICES_URL; // e.g. https://.../prices?city_id={city_id}

// Preview mode: do not overwrite public file, just show N samples
const PREVIEW = process.env.PREVIEW !== 'false';
const PREVIEW_COUNT = Number(process.env.PREVIEW_COUNT || 3);

if (
  !SOURCE_URL &&
  !(process.env.RAPIDAPI_CITIES_URL && process.env.RAPIDAPI_PRICES_URL)
) {
  console.error(
    'Set SOURCE_URL or RAPIDAPI_URL, or set both RAPIDAPI_CITIES_URL and RAPIDAPI_PRICES_URL in your .env.local'
  );
  process.exit(1);
}

async function fetchJson(url) {
  const headers = {};
  if (RAPIDAPI_KEY) headers['x-rapidapi-key'] = RAPIDAPI_KEY;
  if (RAPIDAPI_HOST) headers['x-rapidapi-host'] = RAPIDAPI_HOST;
  headers['Accept'] = 'application/json';

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function normalize(raw) {
  // Try a couple of common shapes
  const items = raw?.data || raw?.countries || raw || [];

  return items.map((it, i) => ({
    Rank: it.rank ?? it.Rank ?? i + 1,
    Country: it.country ?? it.Country ?? it.name ?? it.city ?? 'Unknown',
    'Cost of Living Index': Number(
      it.cost_of_living_index ?? it.costIndex ?? it['Cost of Living Index'] ?? 0
    ),
    'Rent Index': Number(
      it.rent_index ?? it.rentIndex ?? it['Rent Index'] ?? 0
    ),
    'Cost of Living Plus Rent Index': Number(
      it.cost_plus_rent ??
        it.costPlusRent ??
        it['Cost of Living Plus Rent Index'] ??
        0
    ),
    'Groceries Index': Number(
      it.groceries_index ?? it.groceriesIndex ?? it['Groceries Index'] ?? 0
    ),
    'Restaurant Price Index': Number(
      it.restaurant_index ??
        it.restaurantIndex ??
        it['Restaurant Price Index'] ??
        0
    ),
    'Local Purchasing Power Index': Number(
      it.local_purchasing_power ??
        it.localPurchasingPower ??
        it['Local Purchasing Power Index'] ??
        0
    ),
  }));
}

// Helper: compute index given USD price and base price
function computeIndex(priceUsd, baseUsd) {
  if (!priceUsd || !baseUsd) return 100;
  return (priceUsd / baseUsd) * 100;
}

// Heuristic search helpers
function findItemByKeywords(items, keywords, { exclude = [] } = {}) {
  const kws = keywords.map((k) => k.toLowerCase());
  const exs = exclude.map((k) => k.toLowerCase());
  for (const it of items) {
    const name = (it.item_name || it.category_name || '').toLowerCase();
    if (exs.some((e) => name.includes(e))) continue;
    if (kws.some((k) => name.includes(k))) return it;
  }
  return null;
}

function findRentItem(items) {
  // Prefer explicit rent / 1 bedroom monthly rent items and avoid buy/square-meter entries
  const rentKeywords = [
    'rent',
    '1 bedroom',
    '1-bedroom',
    'studio',
    'monthly rent',
    'apartment in city center',
    'apartment outside city center',
  ];
  const exclude = [
    'buy',
    'price per square meter',
    'square meter',
    'buy apartment',
    'sell',
    'sale',
  ];

  let item = findItemByKeywords(items, rentKeywords, { exclude });
  if (item) return item;

  // fallback: look for 'apartment' but exclude buy keywords
  item = findItemByKeywords(items, ['apartment', 'flat'], { exclude });
  return item;
}

function estimateGroceriesFromItems(items) {
  // Collect common grocery items and sum their avg USD prices when available
  const groceryKeywords = [
    'milk',
    'bread',
    'eggs',
    'chicken',
    'rice',
    'apples',
    'potatoes',
    'banana',
    'tomato',
  ];
  const found = items.filter((it) => {
    const name = (it.item_name || '').toLowerCase();
    return groceryKeywords.some((k) => name.includes(k));
  });

  const prices = found
    .map((it) => {
      if (it.usd && it.usd.avg) return parseFloat(it.usd.avg);
      if (it.avg) return parseFloat(it.avg);
      return null;
    })
    .filter(Boolean);

  if (prices.length === 0) return null;

  // Sum the found item prices to approximate a small groceries basket.
  // This is heuristic: we assume the listed items represent unit prices and summing gives a weekly estimate.
  const sum = prices.reduce((s, p) => s + p, 0);
  return sum;
}

async function fetchRepresentativeCity(country) {
  // Build URL
  let url;
  if (RAPIDAPI_CITIES_URL && RAPIDAPI_CITIES_URL.includes('{country}')) {
    url = RAPIDAPI_CITIES_URL.replace('{country}', encodeURIComponent(country));
  } else if (RAPIDAPI_CITIES_URL) {
    url = `${RAPIDAPI_CITIES_URL}${
      RAPIDAPI_CITIES_URL.includes('?') ? '&' : '?'
    }country=${encodeURIComponent(country)}`;
  } else if (SOURCE_URL && SOURCE_URL.includes('/cities')) {
    url =
      SOURCE_URL +
      (SOURCE_URL.includes('?') ? '&' : '?') +
      `country=${encodeURIComponent(country)}`;
  } else {
    throw new Error('No cities endpoint configured (set RAPIDAPI_CITIES_URL)');
  }

  const data = await fetchJson(url);
  // Normalize response shapes
  const list = data?.cities || data || [];
  if (!Array.isArray(list) || list.length === 0) return null;

  // Prefer exact country_name match, else return first
  const match = list.find(
    (c) =>
      (c.country_name || c.Country || '').toLowerCase() ===
      country.toLowerCase()
  );
  const chosen = match || list[0];
  return chosen;
}

async function fetchPricesForCity(cityId) {
  let url;
  if (RAPIDAPI_PRICES_URL && RAPIDAPI_PRICES_URL.includes('{city_id}')) {
    url = RAPIDAPI_PRICES_URL.replace(
      '{city_id}',
      encodeURIComponent(String(cityId))
    );
  } else if (RAPIDAPI_PRICES_URL) {
    url = `${RAPIDAPI_PRICES_URL}${
      RAPIDAPI_PRICES_URL.includes('?') ? '&' : '?'
    }city_id=${encodeURIComponent(String(cityId))}`;
  } else if (SOURCE_URL && SOURCE_URL.includes('/prices')) {
    url =
      SOURCE_URL +
      (SOURCE_URL.includes('?') ? '&' : '?') +
      `city_id=${encodeURIComponent(String(cityId))}`;
  } else {
    throw new Error('No prices endpoint configured (set RAPIDAPI_PRICES_URL)');
  }

  return fetchJson(url);
}

async function previewNormalize() {
  // Load the bundled country list
  const bundled = JSON.parse(
    await fs.readFile(path.resolve('./src/data/cost-of-living.json'), 'utf8')
  );
  const countries = bundled.map((c) => c.Country).filter(Boolean);
  const preview = [];

  for (let i = 0; i < Math.min(PREVIEW_COUNT, countries.length); i += 1) {
    const country = countries[i];
    try {
      const city = await fetchRepresentativeCity(country);
      if (!city) {
        console.warn('No city found for', country);
        continue;
      }

      const pricesRes = await fetchPricesForCity(
        city.city_id ?? city.cityId ?? city.id ?? city.city_id
      );
      const prices = pricesRes.prices || pricesRes || [];

      // heuristics for meal, groceries, rent
      const mealItem = findItemByKeywords(prices, [
        'meal',
        'inexpensive restaurant',
        'restaurant',
        'cafe',
      ]);
      const groceriesItem = findItemByKeywords(prices, [
        'grocery',
        'supermarket',
        'weekly groceries',
        'groceries',
      ]);
      const rentItem = findItemByKeywords(prices, [
        '1 bedroom',
        '1-bedroom',
        'rent',
        'apartment rent',
        'monthly rent',
        'apartment',
      ]);

      const mealUsd = mealItem?.usd?.avg
        ? parseFloat(mealItem.usd.avg)
        : mealItem?.avg || null;
      const groceriesUsd = groceriesItem?.usd?.avg
        ? parseFloat(groceriesItem.usd.avg)
        : groceriesItem?.avg || null;
      const rentUsd = rentItem?.usd?.avg
        ? parseFloat(rentItem.usd.avg)
        : rentItem?.avg || null;

      // base prices (same as app)
      const base = { meal: 12, groceries: 60, rent: 800 };

      const restaurantIndex =
        Math.round(computeIndex(mealUsd, base.meal) * 10) / 10;
      const groceriesIndex =
        Math.round(computeIndex(groceriesUsd, base.groceries) * 10) / 10;
      const rentIndex = Math.round(computeIndex(rentUsd, base.rent) * 10) / 10;

      const costOfLivingIndex =
        Math.round(((restaurantIndex + groceriesIndex + rentIndex) / 3) * 10) /
        10;
      const costPlusRentIndex =
        Math.round(((costOfLivingIndex + rentIndex) / 2) * 10) / 10;

      preview.push({
        Country: country,
        City: city.city_name || city.cityName || city.name,
        'Restaurant Price Index': restaurantIndex || 100,
        'Groceries Index': groceriesIndex || 100,
        'Rent Index': rentIndex || 100,
        'Cost of Living Index': costOfLivingIndex || 100,
        'Cost of Living Plus Rent Index': costPlusRentIndex || 100,
        'Local Purchasing Power Index': 100,
      });
    } catch (err) {
      console.error('Failed to normalize', country, err.message || err);
    }
  }

  console.log('Preview normalized (first', preview.length, 'countries):');
  console.log(JSON.stringify(preview, null, 2));
}

(async function main() {
  try {
    if (PREVIEW) {
      await previewNormalize();
      console.log(
        '\nPreview complete. Set PREVIEW=false to write output to public file.'
      );
      return;
    }

    console.log('Fetching full dataset is not implemented in preview mode.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
