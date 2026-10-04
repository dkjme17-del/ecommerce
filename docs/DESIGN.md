# DKmarket — Design System & Choix d'interface

Refonte complète de l'interface du marketplace. Ce document explique les choix structurants
fait par contradiction directe avec "l'aspect template IA" : pas de dégradés violets omniprésents,
ni de cartes interchangeables, ni d'emojis, ni de gris clair illisible.

## 1. Identité

- **Nom** : DKmarket — « DK » (initiales du fondateur) + « market », contraction directe de l'activité.
- **Positionnement** : marketplace mobile-first reliant boutiques locales et acheteurs.

## 2. Palette

| Token | Rôle | Clair | Sombre |
| --- | --- | --- | --- |
| `--paper/-muted/-sunken` | Fonds (app, zones alternées, sous-couches) | blanc → gris-vert doux | noir-vert profond |
| `--ink-strong/ink/ink-muted/ink-faint` | Textes (titre, corps, secondaire, discret) | vert-noir | blanc cassé |
| `--line/-soft/-strong` | Sépare, sans gris pur | vert-gris | vert-gris sombre |
| `brand-*` | Primaire (« feuille de baobab ») : CTA, prix, liens | émeraude profond | émeraude claircie |
| `accent-*` | Safran/mangue : hero, badges promo, CTA vendeur | mangue | mangue |

Les neutres sont **sémantiques** (ink/paper/line) via variables CSS : un changement de thème
n'altère pas la hiérarchie visuelle. En sombre, les teintes colorées (statuts, avis, alertes)
sont claircies dans `globals.css` pour garder un contraste AA et lisibles sur fond sombre.

## 3. Typographie

- **Display : Fraunces** (serif éditorial) — titres, hero, marque. Caractère premium et local,
  différenciant fortement des templates sans-serif génériques.
- **Corps : Inter** — tout le reste (UI, formulaires, tableaux).
- Chargées via `next/font` (swap, auto-subset), exposées en `--font-display` / `--font-sans`.

## 4. Composants & états

- `.btn`/`.input`/`.label`/`.card`/`.badge` tokenisés dans `@layer components`.
- Cartes produits : hover légère élévation + zoom image doux (transform, GPU) ; surlignage de
  la marque sur le titre et la bordure.
- Skeleton shimmer (`::after` + `animation: shimmer`), pour ne jamais voir de spinner plein écran
  sur les grilles de produits.
- EmptyState iconé, erreurs non-bloquantes dans des encarts discrets.

## 5. Dark mode

- Piloté par la classe `.dark` sur `<html>` ; script inline dans `<head>` (avant hydratation)
  pour appliquer le thème stocké en `localStorage` sans flash (FOUC).
- `ThemeProvider` (`lib/theme.jsx`) + bascule (soleil/lune) dans la Navbar (desktop et mobile).
- Prière `prefers-color-scheme` en première visite.

## 6. Mouvement & micro-interactions

- `Reveal` : apparition douce au scroll via IntersectionObserver (classes `.reveal`/`.reveal-visible`).
- `prefers-reduced-motion` : toutes les animations/transitions réduites à ~0.
- 60fps : uniquement des `transform`/`opacity` dans les transitions visibles.

## 7. Accessibilité

- Contraste AA sur les deux thèmes (y compris les pastilles de statut).
- `:focus-visible` visible sur tous les éléments cliquables ; `aria-label` sur les icônes.
- Ordres de lecture et target sizes compatibles mobile (min 44–40 px sur les contrôles de nav).

## 8. Périmètre de la refonte

- `tailwind.config.ts` + `app/globals.css` (design system complet, clair + sombre).
- `app/layout.jsx` (fonts, ThemeProvider, script anti-FOUC) ; `lib/theme.jsx`.
- `components/Navbar.jsx` (marque DKmarket, recherche, toggle thème, menu mobile),
  `Footer.jsx`, `ProductCard.jsx`, `CategoryIcon.jsx` (SVG par catégorie, emojis du seed remplacés),
  `Reveal.jsx`, `Ui.jsx` (skeletons + EmptyState iconé).
- Pages refondues : accueil (hero, catégories, produits, CTA vendeur), `products` (filtres,
  compteur, skeletons, pagination), `products/[slug]` (galerie, bloc d'achat, réassurance, avis).
- Classes globales migrées des gris mono vers les tokens sémantiques (refactor automatisé).

## 9. Vérification

- `npm run build` OK (22 routes) ; `next start` : toutes les routes testées en 200.
- Connexion via le proxy Next `/api/v1/auth/login` : 200 (aucune régression back-end).
- Passage clair/sombre fluide, sans flash, grâce au script d'init.