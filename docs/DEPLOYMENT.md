# Guide de déploiement — serveur Ubuntu 22.04 / 24.04

Objectif : déployer la marketplace sur un VPS (Hetzner, OVH, DigitalOcean — ~2 vCPU / 4 Go RAM).

## 1. Préparation du serveur

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl ufw
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Installer Node.js 22+ (via NodeSource) :

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable            # yarn/pnpm au besoin
```

Installer PostgreSQL :

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE USER ecommerce WITH PASSWORD 'STRONG_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE ecommerce OWNER ecommerce;"
sudo -u postgres psql -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"   # recherche
```

## 2. Mise en place du code

```bash
sudo mkdir -p /var/www/ecommerce && sudo chown "$USER":"$USER" /var/www/ecommerce
cd /var/www/ecommerce
git clone <votre-repo> .
# ou copier le dossier projet_ecommerce
```

### Backend

```bash
cd backend
npm install --omit=dev
cp .env.example .env
nano .env   # NODE_ENV=production, DATABASE_URL, JWT_SECRET fort, PAYMENT_MODE=sandbox
npx prisma generate
npx prisma migrate deploy
npm run seed
```

Service systemd `sudo nano /etc/systemd/system/ecommerce-api.service` :

```ini
[Unit]
Description=Marketplace API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/ecommerce/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/www/ecommerce/backend/uploads
sudo systemctl daemon-reload && sudo systemctl enable --now ecommerce-api
```

### Frontend

```bash
cd ../frontend
npm install
nano .env.production   # API_URL=http://localhost:4000 (optionnel, c'est la valeur par défaut)
npm run build
```

> **Important** : `API_URL` doit être l'**origine** du backend, *sans* `/api/v1`
> (`http://localhost:4000`, les deux apps étant sur le même serveur). Les pages
> rendues côté serveur appellent l'API directement ; le navigateur, lui, passe par
> nginx qui route `/api/*` vers le backend. Ne créez pas de `.env.local` sur le
> serveur (il aurait priorité sur `.env.production` dans Next.js).

Service systemd `sudo nano /etc/systemd/system/ecommerce-web.service` :

```ini
[Unit]
Description=Marketplace Web
After=network.target ecommerce-api.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/ecommerce/frontend
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now ecommerce-web
```

## 3. Reverse proxy nginx

`sudo nano /etc/nginx/sites-available/ecommerce` :

```nginx
server {
    listen 80;
    server_name shop.example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 120s;
        client_max_body_size 10M;
    }

    location /uploads/ {
        alias /var/www/ecommerce/backend/uploads/;
        add_header Cache-Control "public, max-age=86400, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# En-têtes de sécurité globaux (avant la fin de la config, dans server { } :
# add_header X-Frame-Options DENY always;
# add_header X-Content-Type-Options nosniff always;
# add_header Referrer-Policy strict-origin-when-cross-origin always;
```

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 4. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.example.com
```

## 5. Mise à jour du code

```bash
cd /var/www/ecommerce
git pull
cd backend && npm install --omit=dev && npx prisma migrate deploy && sudo systemctl restart ecommerce-api
cd ../frontend && npm install && npm run build && sudo systemctl restart ecommerce-web
```

Créer un script `deploy.sh` pour automatiser ces étapes et l'ajouter à un cron quotidien si souhaité.

## 6. Vérification post-déploiement

```bash
curl -s https://shop.example.com/api/v1/status        # -> {"status":"ok"}
curl -s https://shop.example.com/ | head -c 200        # HTML du site
sudo journalctl -u ecommerce-api -n 50 --no-pager      # logs API
sudo journalctl -u ecommerce-web -n 50 --no-pager      # logs Next.js
```

- Le seed initial (`npm run seed`) a créé les comptes démo — **changez ou supprimez**
  `admin@demo.com`, `seller@demo.com` et `client@demo.com` avant mise en production
  réelle (ou n'exécutez pas le seed sur le serveur de production).

## 7. Paiements en production

L'intégration **Wave live** (Checkout API) est implémentée : l'acheteur est redirigé vers Wave,
qui notifie le serveur par webhook signé (HMAC-SHA256) et ne confirme la commande que lorsque les
fonds sont réellement réceptionnés.

### Checklist de mise en service Wave

1. Créer un compte marchand **Wave Business** sur business.wave.com et suivre l'onboarding
   (pièces d'identité + numéro de portable marchand). Wave ne propose **pas de sandbox** : toutes
   les clés testées touchent le portefeuille marchand — d'où un test initial à petit montant.
2. Générer une **clé API** (`WAVE_API_KEY`, format `wave_sn_prod_…`) dans le portail développeur.
3. Exposer le webhook `POST https://votre-domaine/api/v1/payments/webhook/momo` en HTTPS et
   l'enregistrer chez Wave ; Wave fournit alors un **webhook secret** (`WAVE_WEBHOOK_SECRET`).
4. Dans `backend/.env` du serveur : `PAYMENT_MODE=live`, `WAVE_API_KEY`, `WAVE_WEBHOOK_SECRET`.
   Les champs vides sont **obligatoires** (l'app refuse de démarrer sans eux en production).
5. Redémarrer le service API (`sudo systemctl restart ecommerce-api`) puis tester un paiement
   réel à petit montant (les URLs de retour sont construites depuis `CLIENT_URL`).
6. Vérifier les logs (`journalctl -u ecommerce-api -f`) et confirmer que le statut de la commande
   passe à « Payée » uniquement après retour du webhook.

> En `live`, seuls les moyens réellement intégrés sont proposés aux acheteurs (Wave aujourd'hui ;
> Orange Money et MTN MoMo affichés « Bientôt »). Les **payouts** vendeurs restent en attente
> (`PENDING`) en mode live : le transfert réel (Wave Payout à venir) et le versement manuel sont
> à traiter depuis l'espace admin.

## 8. Bonnes pratiques de production

- Vérifier quotidiennement les sauvegardes PostgreSQL (`pg_dump` en cron).
- Surveiller avec `journalctl -u ecommerce-api -f` et un service type UptimeRobot.
- Restreindre les uploads (taille/type sont déjà contrôlés) et rouler les `JWT_SECRET`.
- Configurer un reverse cache (Redis) si le catalogue grossit.
- **Mise à jour Next.js** : `npm audit` signale de temps en temps des avis sur la
  chaîne PostCSS embarquée dans Next (dépendance de build, sans impact sur le runtime
  servi par `next start`). Mettre à jour Next régulièrement (`npm i next@latest`) dans
  le frontend.