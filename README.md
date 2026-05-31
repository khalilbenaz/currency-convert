# Convertisseur de devises

Application web de conversion de devises en temps réel, sans clé API, avec historique graphique sur 30 jours et gestion de paires favorites.

## Fonctionnalités

- **Conversion instantanée** : saisissez un montant et choisissez vos devises — le résultat s'affiche automatiquement (debounce 400 ms).
- **35+ devises** : EUR, USD, GBP, JPY, MAD (Dirham marocain), CHF, CAD, AUD, CNY, SEK, NOK, DKK, NZD, SGD, HKD, KRW, INR, BRL, MXN, ZAR, TRY, RUB, PLN, CZK, HUF, RON, BGN, ISK, AED, SAR, THB, IDR, MYR, PHP…
- **Taux unitaire** : affichage de `1 FROM = x TO` en temps réel.
- **Bouton Échanger** : inverse source et cible en un clic.
- **Sparkline 30 jours** : mini-graphique SVG inline montrant l'évolution du taux sur les 30 derniers jours (zone remplie, couleur tendance indigo/rouge).
- **Paires favorites** : ajoutez/retirez des paires en un clic, persistées dans le localStorage.
- **États de chargement et d'erreur** : indicateurs visuels pour chaque requête réseau.
- **UI soignée** : fond dégradé clair, accents indigo, police Inter, 100% responsive.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Les fichiers produits se trouvent dans `dist/`.

## Déploiement Cloudflare Pages

```bash
npm run deploy
```

Requiert `wrangler` configuré avec votre compte Cloudflare. Le fichier `wrangler.toml` est déjà présent.

## Stack technique

| Technologie | Rôle |
|---|---|
| React 18 | UI déclarative |
| TypeScript (strict) | Typage statique |
| Vite | Bundler et dev server |
| Tailwind CSS v3 | Styles utilitaires |
| Frankfurter API | Taux de change (BCE, gratuit, sans clé) |
| SVG inline | Graphique sparkline |
| localStorage | Persistance des favoris |

## API utilisée

- `GET https://api.frankfurter.app/latest?amount=MONTANT&from=FROM&to=TO` — taux du jour
- `GET https://api.frankfurter.app/YYYY-MM-DD..?from=FROM&to=TO` — historique 30 jours

Aucune clé API requise. Données issues de la Banque Centrale Européenne, mises à jour chaque jour ouvré.

## Licence

MIT — voir fichier `LICENSE`.
