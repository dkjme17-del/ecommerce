# DKmarket — Marketplace Multivendeurs (type Amazon / Jumia)

**DKmarket** est une plateforme **marketplace** où plusieurs boutiques vendent leurs produits.
La plateforme prélève automatiquement une **commission de 1 % sur chaque vente**.

## Stack

| Couche      | Technologie                                     |
|-------------|-------------------------------------------------|
| Frontend    | Next.js (App Router) + Tailwind CSS             |
| Backend     | Node.js / Express (API REST)                    |
| Base de données | PostgreSQL + Prisma ORM                      |
| Paiement    | Mobile Money (Wave, Orange Money, MTN MoMo)     |
| Auth        | JWT + bcrypt                                    |

## Architecture (monorepo)

```
projet_ecommerce/
├── backend/          # API Express (Port 4000)
│   ├── prisma/       # Schéma BDD + seed
│   └── src/
│       ├── config/   # Config (env, constants)
│       ├── controllers/  # Logique des routes
│       ├── routes/       # Endpoints API
│       ├── middlewares/  # Auth, upload, erreurs
│       ├── services/     # Commission, paiements, payouts
│       └── lib/          # Prisma, JWT, mot de passe
├── frontend/         # Application Next.js (Port 3000)
└── docs/             # Documentation
```

## Démarrage rapide (local)

### 1. Base de données

Installer PostgreSQL puis créer la base :

```sql
CREATE DATABASE ecommerce;
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # renseigner DATABASE_URL et JWT_SECRET
npx prisma migrate dev --name init
npm run seed
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir `http://localhost:3000`.

### Comptes de démonstration (créés par le seed)

| Rôle      | Email                | Mot de passe |
|-----------|----------------------|--------------|
| Client    | client@demo.com      | demo123      |
| Vendeur   | seller@demo.com      | demo123      |
| Admin     | admin@demo.com       | demo123      |

Les comptes démo, la boutique et les produits de démonstration ne sont **créés qu'en non-production** (`NODE_ENV !== 'production'`). En production, le seed ne crée que les catégories ; pour forcer les données de démo, utilisez `SEED_DEMO=true node prisma/seed.js`.

## Coin de commission

- Taux : **1 %** (configurable via `COMMISSION_RATE`).
- Calculé à la commande, ligne par ligne (`orderItem.commission`).
- Le solde du vendeur (Store.balance) reçoit net (`prix - commission`) dès le paiement.
- Les **payouts** vers le mobile money du vendeur sont déclenchés automatiquement au-dessus d'un seuil (`MIN_PAYOUT_AMOUNT`) ou manuellement par l'admin.

## Paiement mobile money

- `PAYMENT_MODE=sandbox` (défaut) : paiement **simulé** (marqué payé après un court délai) — idéal pour la démo locale.
- `PAYMENT_MODE=live` : paiement **réel via Wave** (Checkout API). L'acheteur est redirigé vers Wave, qui notifie le serveur par webhook signé (`Wave-Signature`, HMAC-SHA256) et confirme les fonds.
  - Configuration requise : `WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET` (portail développeur business.wave.com). Wave ne propose **pas de sandbox** : les clés testées touchent le portefeuille marchand. Voir `backend/.env.example`.
  - Orange Money et MTN MoMo sont à intégrer (méthode `paymentMethod` non Wave refusée en mode live).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Base de données](docs/DATABASE.md)
- [Endpoints API](docs/API.md)
- [Guide de déploiement serveur](docs/DEPLOYMENT.md)

## Licence
