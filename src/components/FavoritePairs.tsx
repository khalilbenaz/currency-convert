import type { FavoritePair } from '../types';
import { CURRENCIES } from '../currencies';

interface FavoritePairsProps {
  favorites: FavoritePair[];
  onSelect: (pair: FavoritePair) => void;
  onRemove: (pair: FavoritePair) => void;
}

function getCurrencyName(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.name ?? code;
}

export default function FavoritePairs({ favorites, onSelect, onRemove }: FavoritePairsProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Paires favorites
      </h2>
      <div className="flex flex-wrap gap-2">
        {favorites.map((pair) => (
          <div
            key={`${pair.from}-${pair.to}`}
            className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-full pl-3 pr-1.5 py-1"
          >
            <button
              onClick={() => onSelect(pair)}
              className="text-sm font-medium text-indigo-700 hover:text-indigo-900 transition-colors rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label={`Sélectionner ${pair.from} vers ${pair.to}`}
            >
              {pair.from} → {pair.to}
            </button>
            <button
              onClick={() => onRemove(pair)}
              className="flex items-center justify-center w-5 h-5 rounded-full text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-colors leading-none focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label={`Supprimer ${pair.from} vers ${pair.to} des favoris`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {favorites.length} paire{favorites.length > 1 ? 's' : ''} — {' '}
        {favorites.map((p) => `${getCurrencyName(p.from)} / ${getCurrencyName(p.to)}`).join(', ')}
      </p>
    </div>
  );
}
