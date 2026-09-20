# Architecture

## Vue d'ensemble

```
                    ┌──────────────────┐
                    │   Navigateur     │
                    │  (mobile first)  │
                    └────────┬─────────┘
                             │ HTTPS
              ┌──────────────┴──────────────┐
              │        Next.js (3000)       │
              │  Frontend / rendu SSR       │
              └──────────────┬──────────────┘
                             │ /api Connexion                          ┌──────────────────┐
                             ▼                                          │  PostgreSQL       │
              ┌──────────────────────────┐                              │  (5432)          │
              │  Express API  (4000)     │────────── Prisma ───────────▶│                  │
              │  REST / JWT / uploads    │                              └──────────────────┘
              └──────────┬───────────────┘
                         │                                         ┌──────────────────┐
                         ▼                                         │  Mobile Money    │
              ┌──────────────────────────┐                          │  Wave / Orange / │
              │  Paiement Mobile Money   │─────────────────────────▶│  MTN MoMo        │
              │  (sandbox en dev)        │                          │  (API Sandbox)   │
              └──────────────────────────┘                          └──────────────────┘
```

## Principes

- **API REST** indépendante du frontend : le frontend Next.js appelle le backend Express via un proxy /api.
- **Rôles** : `ADMIN`, `SELLER`, `CUSTOMER` — protégés par middleware JWT + vérification de rôle.
- **Dissociation client / vendeur** : un utilisateur peut avoir deux types de compte. Pour rester simple, un compte peut être `CUSTOMER` **et** `SELLER` simultanément (champs de rôle multiples, voir `User.roles`).
- **Commission 5 %** centralisée dans `services/commission.service.js` pour éviter les calculs dispersés. Les montants sont stockés en **centimes (integer)** pour éviter les erreurs d'arrondi.
- **Payouts** : le solde du vendeur est crédité à chaque vente payée (net de commission). Un service d'encaissement verse le solde vers le compte mobile money du vendeur lorsqu'un seuil est atteint.

## Frontend (Next.js App Router)

- Pages publiques : accueil/marketplace, liste produits, détail produit, boutique.
- Client : panier, checkout, suivi commandes, historique, avis.
- Vendeur : tableau de bord (produits, stock, commandes, revenus, payouts), création de boutique.
- Admin : tableau de bord (ventes, commission, vendeurs, produits, validation de boutiques).
- UI mobile-first avec Tailwind CSS.

## Backend (Express)

- Dossier `src/controllers` : logique métier.
- Dossier `src/routes` : montage des endpoints (`/status`, `/api/v1/...`).
- Dossier `src/middlewares` : `auth` (JWT + rôles), `upload` (multer), `error` (handler global), `validate`.
- Dossier `src/services` : commission, paiements mobile money, payouts, notifications.
- Dossier `src/lib` : client Prisma, helpers JWT / bcrypt.

## Sécurité

- Mots de passe hachés **bcrypt**.
- JWT signé, expirant (défaut 7 jours), transmis en `Authorization: Bearer`.
- Validation des entrées côté API.
- Uploads limités en type et taille (`middlewares/upload.js`).
- En production : HTTPS (reverse proxy nginx/Caddy), variables sensible en `.env`.