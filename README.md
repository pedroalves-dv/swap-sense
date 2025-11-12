# SwapSense — Global Currency Tool

SwapSense is a compact, responsive currency conversion app with an integrated Spending Power panel that estimates how far your money goes in different countries using cost-of-living indices.

This repository contains a Vite + React + TypeScript application styled with SCSS. The app is intended as an MVP with an extensible updater script for refreshing cost-of-living data outside the client.

## Features

- Currency conversion UI with live rates
- Spending Power panel: estimates purchasing power using country indices (restaurant, groceries, rent)
- Compare mode: compare two locations side-by-side (use the "Compare" mode in the header)
- Light / dark themes with tuned dark-mode colors
- Accessible controls and responsive layout

## Technologies

- React + TypeScript
- Vite (dev server & build)
- SCSS for styling

## Getting started (local development)

1. Install dependencies

```bash
npm install
```

2. Start development server

```bash
npm run dev
```

3. Build for production

```bash
npm run build
```

Open the dev server (usually http://localhost:5173) and use the header toggle to switch between Convert and Compare modes.

## Usage notes

- Convert mode (default): the left card is the Currency Converter and the right card shows Spending Power for the selected target currency.
- Compare mode: use the "Compare" button in the header to open a full-width comparison view for two locations.
- Spending Power data: the app reads `public/data/cost-of-living.json` at runtime and falls back to `src/data/cost-of-living.json` if the public file is missing.

## Updating cost-of-living data

An updater script is included to fetch and normalize external cost-of-living data and produce `public/data/cost-of-living.json`.

Preview (safe, default):

```bash
npm run update:col
```

Write to `public/` (overwrite):

```bash
PREVIEW=false npm run update:col
```

The updater accepts API keys via a local `.env.local` file (see `scripts/update-cost-of-living.js`). Keys are not committed.

## Configuration and environment

- `.env.local` (local only) — put RapidAPI keys and endpoint overrides here for the updater script. Example variables used by the script: `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, `RAPIDAPI_CITIES_URL`, `RAPIDAPI_PRICES_URL`.

## Styling & design notes

- Dark mode variables are in `src/styles/_variables.scss` and aim for muted greyer base surfaces with subtle blue accents.
- The header logo uses CSS masking so a single PNG can be recolored via the `.header-logo` background-color.

## Project layout

- `src/components/` — UI components (CurrencyConverter, SpendingPower, Header, Footer, ComparisonMode)
- `src/data/` — bundled static data (fallback cost-of-living JSON)
- `public/data/` — runtime-overridable data target for the updater
- `scripts/` — helper scripts (data updater)

## Scripts

- `npm run dev` — start dev server
- `npm run build` — create production bundle
- `npm run update:col` — run the cost-of-living updater (preview by default)

## Troubleshooting

- If Spending Power shows "No cost of living data available": ensure `public/data/cost-of-living.json` exists or rely on the bundled `src/data` fallback. You can run the updater in preview to inspect normalized output.
- RapidAPI 429 rate limits: when running the updater, add retries/throttling or upgrade plan if you hit rate limits.

## Contributing

Contributions welcome. Please open an issue or PR. Small fixes, accessibility improvements, and tests are especially helpful.

## License & contact

Contact: pedroalves.dv@gmail.com

License: (add your license here)
