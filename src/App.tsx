import { useState, useEffect, useCallback, useRef } from 'react';
import { CURRENCIES } from './currencies';
import type { ConversionResult, HistoryPoint, FavoritePair } from './types';
import Sparkline from './components/Sparkline';
import FavoritePairs from './components/FavoritePairs';

const FAVORITES_KEY = 'currency-convert-favorites';

function formatNumber(value: number, decimals = 4): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value);
}

function get30DaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function loadFavorites(): FavoritePair[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as FavoritePair[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: FavoritePair[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export default function App() {
  const [amount, setAmount] = useState<string>('1');
  const [from, setFrom] = useState<string>('EUR');
  const [to, setTo] = useState<string>('USD');

  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loadingConvert, setLoadingConvert] = useState(false);
  const [errorConvert, setErrorConvert] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<FavoritePair[]>(loadFavorites);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Conversion
  const doConvert = useCallback(async (amt: string, fromCode: string, toCode: string) => {
    const parsed = parseFloat(amt.replace(',', '.'));
    if (!parsed || parsed <= 0 || fromCode === toCode) {
      setResult(null);
      setErrorConvert(null);
      return;
    }
    setLoadingConvert(true);
    setErrorConvert(null);
    try {
      // open.er-api.com : gratuit, sans clé, ~160 devises (dont MAD)
      const url = `https://open.er-api.com/v6/latest/${fromCode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      if (data.result !== 'success' || !data.rates || typeof data.rates[toCode] !== 'number') {
        throw new Error('Devise non disponible');
      }
      const rate: number = data.rates[toCode];
      setResult({
        amount: parsed,
        from: fromCode,
        to: toCode,
        rate,
        convertedAmount: parsed * rate,
      });
    } catch (err) {
      setErrorConvert('Impossible de récupérer le taux. Vérifiez votre connexion.');
      setResult(null);
    } finally {
      setLoadingConvert(false);
    }
  }, []);

  // History for sparkline
  const doHistory = useCallback(async (fromCode: string, toCode: string) => {
    if (fromCode === toCode) {
      setHistory([]);
      return;
    }
    // L'historique vient de Frankfurter (taux BCE) : indisponible pour les autres devises (ex. MAD).
    const ECB = new Set(['EUR','USD','JPY','BGN','CZK','DKK','GBP','HUF','PLN','RON','SEK','CHF','ISK','NOK','TRY','AUD','BRL','CAD','CNY','HKD','IDR','ILS','INR','KRW','MXN','MYR','NZD','PHP','SGD','THB','ZAR']);
    if (!ECB.has(fromCode) || !ECB.has(toCode)) {
      setHistory([]);
      setErrorHistory(null);
      setLoadingHistory(false);
      return;
    }
    setLoadingHistory(true);
    setErrorHistory(null);
    try {
      const start = get30DaysAgo();
      const url = `https://api.frankfurter.dev/v1/${start}..?from=${fromCode}&to=${toCode}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      const data = await res.json();
      const points: HistoryPoint[] = Object.entries(data.rates as Record<string, Record<string, number>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, rates]) => ({ date, rate: rates[toCode] }));
      setHistory(points);
    } catch {
      setErrorHistory('Impossible de charger l\'historique.');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Debounced trigger
  const triggerConvert = useCallback(
    (amt: string, fromCode: string, toCode: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doConvert(amt, fromCode, toCode);
      }, 400);
    },
    [doConvert]
  );

  useEffect(() => {
    triggerConvert(amount, from, to);
  }, [amount, from, to, triggerConvert]);

  useEffect(() => {
    doHistory(from, to);
  }, [from, to, doHistory]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const isFavorite = favorites.some((f) => f.from === from && f.to === to);

  const toggleFavorite = () => {
    let updated: FavoritePair[];
    if (isFavorite) {
      updated = favorites.filter((f) => !(f.from === from && f.to === to));
    } else {
      updated = [...favorites, { from, to }];
    }
    setFavorites(updated);
    saveFavorites(updated);
  };

  const removeFavorite = (pair: FavoritePair) => {
    const updated = favorites.filter((f) => !(f.from === pair.from && f.to === pair.to));
    setFavorites(updated);
    saveFavorites(updated);
  };

  const selectFavorite = (pair: FavoritePair) => {
    setFrom(pair.from);
    setTo(pair.to);
  };

  const fromCurrency = CURRENCIES.find((c) => c.code === from);
  const toCurrency = CURRENCIES.find((c) => c.code === to);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <header className="w-full max-w-xl mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl" aria-hidden="true">💱</span>
          <h1 className="text-3xl font-bold text-indigo-700 tracking-tight">
            Convertisseur de devises
          </h1>
        </div>
        <p className="text-gray-500 text-sm">Taux en temps réel via Frankfurter • Gratuit • Sans clé API</p>
      </header>

      {/* Card */}
      <main className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-6 space-y-5">

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Montant
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Ex : 100"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            aria-label="Montant à convertir"
          />
        </div>

        {/* Currency selectors */}
        <div className="flex items-end gap-3">
          {/* Source */}
          <div className="flex-1">
            <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
              Devise source
            </label>
            <select
              id="from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer"
              aria-label="Devise source"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <div className="flex-shrink-0 pb-0.5">
            <button
              onClick={handleSwap}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Échanger les devises"
              title="Échanger"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0-.04 1.06l2.1 2.2H6.75a.75.75 0 0 0 0 1.5h8.51l-2.1 2.2a.75.75 0 1 0 1.08 1.04l3.5-3.75a.75.75 0 0 0 0-1.04l-3.5-3.75a.75.75 0 0 0-1.06-.04Zm-6.4 8a.75.75 0 0 0-1.06.04l-3.5 3.75a.75.75 0 0 0 0 1.04l3.5 3.75a.75.75 0 1 0 1.1-1.02l-2.1-2.2h8.56a.75.75 0 0 0 0-1.5H4.74l2.1-2.2a.75.75 0 0 0-.04-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Target */}
          <div className="flex-1">
            <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
              Devise cible
            </label>
            <select
              id="to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer"
              aria-label="Devise cible"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Favorite toggle */}
        <div className="flex justify-end">
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              isFavorite
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'
            }`}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
            </svg>
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </button>
        </div>

        {/* Result */}
        <div
          className={`rounded-xl p-5 transition-all ${
            errorConvert
              ? 'bg-red-50 border border-red-200'
              : 'bg-indigo-50 border border-indigo-100'
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          {loadingConvert && (
            <div className="flex items-center gap-2 text-indigo-500">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Conversion en cours…</span>
            </div>
          )}
          {!loadingConvert && errorConvert && (
            <p className="text-red-600 text-sm font-medium">{errorConvert}</p>
          )}
          {!loadingConvert && !errorConvert && result && from !== to && (
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-700">
                {formatNumber(result.convertedAmount, 2)}{' '}
                <span className="text-xl text-indigo-500">{to}</span>
              </p>
              <p className="text-sm text-gray-500">
                {formatNumber(result.amount, 2)} {fromCurrency?.name ?? from} →{' '}
                {toCurrency?.name ?? to}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                1 {from} = {formatNumber(result.rate, 6)} {to}
              </p>
            </div>
          )}
          {!loadingConvert && !errorConvert && !result && from !== to && (
            <p className="text-gray-400 text-sm">Entrez un montant pour voir la conversion.</p>
          )}
          {from === to && (
            <p className="text-gray-400 text-sm">Sélectionnez deux devises différentes.</p>
          )}
        </div>

        {/* Sparkline */}
        {from !== to && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-600">
                Évolution 30 jours — {from} / {to}
              </h2>
              {loadingHistory && (
                <svg className="animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>

            {errorHistory && (
              <p className="text-red-500 text-xs">{errorHistory}</p>
            )}

            {!loadingHistory && !errorHistory && history.length >= 2 && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <Sparkline data={history} width={540} height={90} />
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>
                    Min : {formatNumber(Math.min(...history.map((h) => h.rate)), 4)} {to}
                  </span>
                  <span>
                    Max : {formatNumber(Math.max(...history.map((h) => h.rate)), 4)} {to}
                  </span>
                </div>
              </div>
            )}

            {!loadingHistory && !errorHistory && history.length < 2 && (
              <p className="text-gray-400 text-xs">Données insuffisantes pour le graphique.</p>
            )}
          </div>
        )}

        {/* Favorites */}
        <FavoritePairs
          favorites={favorites}
          onSelect={selectFavorite}
          onRemove={removeFavorite}
        />
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-400">
        Données fournies par{' '}
        <a
          href="https://www.frankfurter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-indigo-400 transition-colors"
        >
          Frankfurter
        </a>{' '}
        · Taux mis à jour quotidiennement par la BCE
      </footer>
    </div>
  );
}
