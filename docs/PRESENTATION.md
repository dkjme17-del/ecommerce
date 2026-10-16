# DKmarket — Présentation orale

**Livrables**

| Élément | Lien |
|---|---|
| Dépôt GitHub | https://github.com/dkjme17-del/ecommerce |
| Image Docker Hub — API | https://hub.docker.com/r/dkjme17/dkmarket-api |
| Image Docker Hub — Web | https://hub.docker.com/r/dkjme17/dkmarket-web |
| URL publique | http://3.90.18.137/ |

---

## 1. Le projet en une phrase

**DKmarket** est une marketplace multivendeurs (type Amazon / Jumia) : plusieurs
boutiques vendent leurs produits, la plateforme prélève automatiquement une
**commission de 1 %** sur chaque vente et reverse le net au vendeur.

**Stack** : Next.js (frontend) · Express (API REST) · PostgreSQL/Neon via Prisma ·
Docker + Docker Compose · nginx · AWS EC2.

```
Navigateur ──▶ nginx (port 80) ──▶ Next.js :3001 ──▶ Express (réseau Docker) ──▶ Neon PostgreSQL
```

---

## 2. Les commandes utilisées

### 2.1 Développement local

```bash
# Base de données locale (PostgreSQL)
CREATE DATABASE ecommerce;

# Backend
cd backend
npm install
cp .env.example .env          # DATABASE_URL + JWT_SECRET
npx prisma migrate dev --name init
npm run seed                  # crée catégories + comptes démo
npm run dev                   # API sur http://localhost:4000

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev                   # http://localhost:3000
```

### 2.2 Conteneurisation

```bash
# Construction des deux images (backend + frontend)
docker compose build

# Démarrage de la stack complète
docker compose up -d

# Vérification de l'état de santé des conteneurs
docker compose ps
docker compose logs -f backend

# Test de l'API
curl -s http://127.0.0.1/api/v1/status
```

### 2.3 Publication sur Docker Hub

```bash
docker login
docker tag projet_ecommerce-backend:latest  dkjme17/dkmarket-api:latest
docker tag projet_ecommerce-frontend:latest dkjme17/dkmarket-web:latest
docker push dkjme17/dkmarket-api:latest
docker push dkjme17/dkmarket-web:latest
```

### 2.4 Déploiement sur AWS EC2

```bash
# Connexion à l'instance
ssh -i cle.pem ubuntu@3.90.18.137

# Installation de Docker + plugin compose
sudo apt update
sudo apt install -y ca-certificates curl git
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu

# Transfert du code
scp -r deploy ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/
scp backend/.env ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/backend/.env

# Démarrage sur l'instance (images construites hors instance, cf. §4.1)
gunzip -c ~/dkmarket-images.tar.gz | docker load
cd ~/projet_ecommerce && docker compose up -d

# Reverse proxy nginx (point d'entrée public sur le port 80)
sudo bash deploy/setup-nginx.sh

# Vérification finale
curl -s http://3.90.18.137/api/v1/status
```

### 2.5 Mise à jour après un `git push`

```bash
cd ~/projet_ecommerce
git pull --ff-only
docker compose up -d --build --remove-orphans
```

---

## 3. Démo de l'application

Scénario à dérouler devant le jury (http://3.90.18.137/) :

1. **Page d'accueil** — marketplace, liste des produits, recherche.
2. **Fiche produit** — détail, stock, avis, ajout au panier.
3. **Compte client** (`client@demo.com` / `demo123`)
   - Ajouter des articles au panier → passer commande.
   - Choisir le moyen de paiement (Mobile Money) → paiement **sandbox** simulé.
   - Consulter l'historique et le suivi de commande.
4. **Compte vendeur** (`seller@demo.com` / `demo123`)
   - Créer/éditer un produit, uploader une photo.
   - Voir les commandes, le **revenu net** (prix − 1 % de commission), les payouts.
5. **Compte admin** (`admin@demo.com` / `demo123`)
   - Tableau de bord : ventes, **commission encaissée**, vendeurs, produits.
   - Valider une boutique, déclencher un payout.
6. **Preuve technique** : montrer `docker compose ps` (2 services `healthy`) et
   `curl http://3.90.18.137/api/v1/status` → `{"status":"ok"}`.

> Astuce : garder les 3 onglets (client / vendeur / admin) ouverts pour
> montrer la circulation d'une commande d'un bout à l'autre.

---

## 4. Difficultés rencontrées et solutions

### 4.1 Build Next.js tué par l'OOM killer sur une instance t3.micro (1 Go RAM)

- **Problème** : `docker compose build` échoue sur l'instance, le build Next.js
  demande ~1,5 Go de RAM et est tué par l'OOM killer.
- **Solution** : construire **hors instance** (sur le poste de dev), exporter et
  transférer les images :
  ```bash
  docker compose build
  docker save projet_ecommerce-backend:latest projet_ecommerce-frontend:latest | gzip > dkmarket-images.tar.gz
  scp dkmarket-images.tar.gz ubuntu@3.90.18.137:/home/ubuntu/
  # sur l'instance
  gunzip -c ~/dkmarket-images.tar.gz | docker load
  docker compose up -d          # pas de --build
  ```

### 4.2 Perte des photos produits lors d'un `up --build`

- **Problème** : le redémarrage **recrée** le conteneur backend ; sa couche
  inscriptible (qui contenait les uploads) est supprimée → photos perdues.
- **Solution** : persistance via un **volume Docker nommé** (`dkmarket_uploads`)
  monté sur `/app/uploads`, plus un script de migration one-shot
  (`deploy/migrate-uploads.sh`) pour récupérer les fichiers déjà présents.

### 4.3 Connexion Neon refusée après inactivité (erreur P1001)

- **Problème** : PostgreSQL (Neon, *pooled*) coupe les connexions inactives ; au
  démarrage, `prisma migrate deploy` échoue de façon transitoire.
- **Solution** : boucle de **retry** dans le `CMD` du Dockerfile backend
  (5 tentatives espacées de 10 s) avant de lancer le serveur.

### 4.4 L'URL change à chaque redémarrage de l'instance

- **Problème** : sans IP fixe, l'instance EC2 arrêtée/redémarrée reçoit une
  nouvelle IP → l'URL de rendu devient invalide.
- **Solution** : association d'une **Elastic IP** (`3.90.18.137`) qui reste fixe.

### 4.5 `nginx -t` échoue : « duplicate default server »

- **Problème** : le site `default` d'Ubuntu écoute aussi le port 80.
- **Solution** : suppression de `/etc/nginx/sites-enabled/default` dans
  `deploy/setup-nginx.sh` avant le rechargement de nginx.

### 4.6 Paiement Wave en production (webhook signé, pas de sandbox)

- **Problème** : Wave ne fournit pas de sandbox ; la confirmation de commande
  doit être déclenchée par un **webhook signé** (HMAC-SHA256) après réception
  réelle des fonds.
- **Solution** : `PAYMENT_MODE=sandbox` pour la démo (paiement simulé) et
  `PAYMENT_MODE=live` en production, avec vérification de la signature
  `Wave-Signature` côté serveur et vérification que le statut « Payée »
  n'apparaît qu'après le webhook.

### 4.7 Exposition des ports internes

- **Problème** : exposer directement les ports 3000/4000 sur Internet est inutile
  et risqué.
- **Solution** : seule nginx est publique (port 80) ; le frontend n'est lié qu'à
  `127.0.0.1:3001` et le backend n'est **pas publié** par Docker (réseau interne).
