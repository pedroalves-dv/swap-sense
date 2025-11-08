import React from 'react';
import './FavoriteCurrencies.scss';

interface FavoritePair {
  from: string;
  to: string;
  id: string;
  timestamp?: number;
  isFavorite?: boolean;
}

interface FavoriteCurrenciesProps {
  onSelectPair: (from: string, to: string) => void;
  currentFrom: string;
  currentTo: string;
}

// Popular currency pairs as recommendations
const RECOMMENDED_PAIRS: FavoritePair[] = [
  { from: 'USD', to: 'EUR', id: 'rec-usd-eur' },
  { from: 'EUR', to: 'USD', id: 'rec-eur-usd' },
  { from: 'GBP', to: 'USD', id: 'rec-gbp-usd' },
  { from: 'USD', to: 'JPY', id: 'rec-usd-jpy' },
  { from: 'EUR', to: 'GBP', id: 'rec-eur-gbp' },
];

function FavoriteCurrencies({
  onSelectPair,
  currentFrom,
  currentTo,
}: FavoriteCurrenciesProps) {
  const [favorites, setFavorites] = React.useState<FavoritePair[]>([]);
  const [recentPairs, setRecentPairs] = React.useState<FavoritePair[]>([]);
  const [showSavePrompt, setShowSavePrompt] = React.useState(false);

  // Load favorites and recent pairs from localStorage on mount
  React.useEffect(() => {
    const storedFavorites = localStorage.getItem('swapsense-favorites');
    const storedRecent = localStorage.getItem('swapsense-recent');

    if (storedFavorites) {
      try {
        const parsed = JSON.parse(storedFavorites);
        setFavorites(
          parsed.map((f: FavoritePair) => ({ ...f, isFavorite: true }))
        );
      } catch {
        // Failed to parse, ignore
      }
    }

    if (storedRecent) {
      try {
        setRecentPairs(JSON.parse(storedRecent));
      } catch {
        // Failed to parse, ignore
      }
    }
  }, []);

  // Save to localStorage whenever favorites change
  React.useEffect(() => {
    if (favorites.length > 0) {
      localStorage.setItem('swapsense-favorites', JSON.stringify(favorites));
    } else {
      localStorage.removeItem('swapsense-favorites');
    }
  }, [favorites]);

  // Save recent pairs to localStorage
  React.useEffect(() => {
    if (recentPairs.length > 0) {
      localStorage.setItem('swapsense-recent', JSON.stringify(recentPairs));
    }
  }, [recentPairs]);

  // Auto-save current pair to recent when it changes
  React.useEffect(() => {
    if (currentFrom && currentTo && currentFrom !== currentTo) {
      const id = `${currentFrom}-${currentTo}`;
      const timestamp = Date.now();

      // Don't add if it's already a favorite
      const isFavorited = favorites.some((fav) => fav.id === id);
      if (isFavorited) return;

      // Don't add if it's the same as the most recent
      if (recentPairs.length > 0 && recentPairs[0].id === id) return;

      const newPair: FavoritePair = {
        from: currentFrom,
        to: currentTo,
        id,
        timestamp,
        isFavorite: false,
      };

      // Keep only last 3 recent pairs (excluding favorites)
      setRecentPairs((prev) => {
        const filtered = prev.filter((p) => p.id !== id);
        return [newPair, ...filtered].slice(0, 3);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFrom, currentTo, favorites]);

  const addCurrentPairToFavorites = () => {
    const id = `${currentFrom}-${currentTo}`;
    const exists = favorites.some((fav) => fav.id === id);

    if (!exists && currentFrom && currentTo && currentFrom !== currentTo) {
      const newFavorite: FavoritePair = {
        from: currentFrom,
        to: currentTo,
        id,
        isFavorite: true,
      };
      setFavorites([...favorites, newFavorite]);

      // Remove from recent pairs
      setRecentPairs((prev) => prev.filter((p) => p.id !== id));

      setShowSavePrompt(true);
      setTimeout(() => setShowSavePrompt(false), 2000);
    }
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter((fav) => fav.id !== id);
    setFavorites(updated);
  };

  const isCurrentPairFavorited = () => {
    const id = `${currentFrom}-${currentTo}`;
    return favorites.some((fav) => fav.id === id);
  };

  // Get pairs to display: favorites + recent (non-duplicates) + recommendations if needed
  const displayPairs = React.useMemo(() => {
    const pairs = [...favorites];

    // Add recent pairs that aren't already in favorites
    const recentToShow = recentPairs.filter(
      (recent) => !favorites.some((fav) => fav.id === recent.id)
    );
    pairs.push(...recentToShow);

    // If we have very few pairs, add some recommendations
    if (pairs.length < 3) {
      const neededCount = 5 - pairs.length;
      const recommendationsToAdd = RECOMMENDED_PAIRS.filter(
        (rec) =>
          !pairs.some(
            (p) => p.id === rec.id || (p.from === rec.from && p.to === rec.to)
          )
      ).slice(0, neededCount);

      pairs.push(...recommendationsToAdd);
    }

    return pairs;
  }, [favorites, recentPairs]);

  if (displayPairs.length === 0) {
    return null;
  }

  return (
    <div className="favorite-currencies">
      <div className="favorites-header">
        <h3 className="favorites-title">
          {favorites.length > 0 ? 'Quick Access' : 'Recent & Popular'}
        </h3>
        {currentFrom && currentTo && currentFrom !== currentTo && (
          <button
            type="button"
            onClick={addCurrentPairToFavorites}
            className={`add-favorite-btn ${
              isCurrentPairFavorited() ? 'favorited' : ''
            }`}
            disabled={isCurrentPairFavorited()}
            title={
              isCurrentPairFavorited()
                ? 'Already in favorites'
                : 'Add to favorites'
            }
          >
            {isCurrentPairFavorited() ? '★' : '☆'}
          </button>
        )}
      </div>

      {showSavePrompt && (
        <div className="save-prompt">✓ Saved to favorites!</div>
      )}

      <div className="favorites-list">
        {displayPairs.map((pair) => (
          <button
            key={pair.id}
            type="button"
            onClick={() => onSelectPair(pair.from, pair.to)}
            className={`pair-chip ${pair.isFavorite ? 'favorite' : 'recent'}`}
            title={pair.isFavorite ? 'Favorite' : 'Recent or recommended'}
          >
            <span className="pair-text">
              {pair.from} → {pair.to}
            </span>
            {pair.isFavorite && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(pair.id);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    removeFavorite(pair.id);
                  }
                }}
                className="remove-btn"
                aria-label={`Remove ${pair.from} to ${pair.to} from favorites`}
                style={{ cursor: 'pointer', marginLeft: 8 }}
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FavoriteCurrencies;
