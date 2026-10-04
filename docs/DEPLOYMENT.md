# Guide de déploiement — AWS EC2 + Docker

Cible : **une** instance EC2 Ubuntu 24.04 qui héberge toute l'application sous
Docker Compose. Un seul point d'entrée public : le port 80 de l'instance.

> Ce guide remplace l'ancienne procédure « VPS + systemd + PM2 + Node natif ».
> Les services systemd `ecommerce-api` / `ecommerce-web`, le fichier
> `ecosystem.config.cjs` et le script `deploy.sh` ne sont plus utilisés : tout
> passe par `docker compose`.

## 0. Architecture

```
Internet
   │  TCP 80 (et 443 si HTTPS)
   ▼
┌──────────────────────── instance EC2 (Ubuntu 24.04) ───────────────────────┐
│                                                                            │
│   nginx  ── reverse proxy ──▶ 127.0.0.1:3001                               │
│                                    │                                       │
│                        ┌───────────┴────────────┐                          │
│                        │  réseau Docker         │                          │
│                        │                        │                          │
│              dkmarket-web (Next.js)      dkmarket-api (Express)            │
│              port 3000, non publié      port 4000, non publié            │
│                        │         │                  │                     │
│                        │ rewrites /api, /uploads   │                     │
│                        └─────────┴──────────────────┘                     │
│                                  │                    │                    │
│                     volume dkmarket_uploads      Neon PostgreSQL            │
│                     (/app/uploads)             (base externalisée)         │
└────────────────────────────────────────────────────────────────────────────┘
```

Points importants :

- **Seul nginx est joignable** depuis Internet. Les ports 3001 et 4000 ne sont
  pas publiés par Docker ; le frontend n'est lié qu'à la boucle locale.
- **Les images produits vivent dans le volume `dkmarket_uploads`.** Elles
  survivent à un `up --build`, un redémarrage ou un recréage de conteneur.
- **La base est externalisée** (Neon). L'instance n'a pas de PostgreSQL ;
  `DATABASE_URL` pointe vers l'extérieur.

## 1. Provisionner l'instance (console AWS)

| Champ | Valeur |
|---|---|
| AMI | Ubuntu Server 24.04 LTS (64 bits) |
| Type | `t3.small` (2 Go suffisent ; `t3.micro` est juste) |
| Stockage | EBS `gp3`, 20 Go |
| Groupe de sécurité | Entrant : TCP 22 (ton IP), TCP 80 (`0.0.0.0/0`), TCP 443 (`0.0.0.0/0`) |
| Paire de clés | clé EC2 existante ou nouvelle (`.pem`) |

** elastic IP (à faire tout de suite)** : Associate Elastic IP. Sans elle,
l'instance arrêtée puis redémarrée reçoit une nouvelle IP et ton URL de rendu
devient invalide.

```
Elastic IP  ──▶ 3.90.18.137
```

## 2. Préparer l'instance

```bash
ssh -i "chemin/vers/cle.pem" ubuntu@3.90.18.137

sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git

# Docker + plugin compose (version officielle pour Ubuntu)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin \
  docker-compose-plugin
sudo usermod -aG docker ubuntu && newgrp docker   <<< "reconnect la session SSH"

docker version && docker compose version
```

## 3. Transférer le code

```bash
# Sur ta machine
scp -r deploy ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/
scp backend/.env ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/backend/.env
scp frontend/.env.local ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/frontend/.env.local
```

> `backend/.env` n'est **pas** versionné : il doit être copié à la main, avec
> `DATABASE_URL` (Neon), `JWT_SECRET` long et `CLIENT_URL=http://3.90.18.137`.

## 4. Sauvegarder les images produits AVANT tout `up`

**L'ordre est critique.** `docker compose up -d --build` **recrée** le conteneur
backend : son ancienne couche inscriptible, qui contient les photos déjà
envoyées par les vendeurs, est supprimée à ce moment-là. Le volume, lui, démarre
vide. Toute photo non copiée avant cette étape est **définitivement perdue**.

```bash
cd ~/projet_ecommerce
docker compose ps          # etat actuel : les uploads sont dans le conteneur

# A. Si les photos sont encore dans le conteneur backend
bash deploy/migrate-uploads.sh

# B. Si le conteneur a deja ete recree (photos perdues) mais que le dossier
#    backend/uploads existe sur l'hote ou sur ta machine
bash deploy/restore-uploads.sh /chemin/vers/dossier/uploads
```

Puis, depuis la machine qui a les fichiers :

```bash
scp -r backend/uploads ubuntu@3.90.18.137:/home/ubuntu/uploads-restore
ssh ubuntu@3.90.18.137 'sudo bash ~/projet_ecommerce/deploy/restore-uploads.sh /home/ubuntu/uploads-restore'
```

## 5. Démarrer la stack

```bash
cd ~/projet_ecommerce
docker compose up -d --build

docker compose ps           # les deux services doivent être "healthy"
docker compose logs -f backend
```

Le `CMD` du backend enchaîne `prisma migrate deploy` (avec 5 tentatives) puis le
serveur : les migrations sont donc appliquées automatiquement à chaque démarrage.

**Contrôle immédiat :**

```bash
curl -sI http://127.0.0.1/uploads/<un-fichier-de-la-base>.jpg   # doit repondre 200
```

Pour lister les fichiers attendus, les lire dans la base ou dans un produit :
`curl -s http://127.0.0.1/api/v1/products?limit=50 | grep -o '/uploads/[^"]*'`.

## 6. Reverse proxy nginx

```bash
sudo bash deploy/setup-nginx.sh
```

Le script installe nginx, dépose la config, désactive le site par défaut
d'Ubuntu (il écouterait le port 80 en doublon), teste avec `nginx -t` puis
recharge. Le site devient accessible sur **`http://3.90.18.137/`**.

Dans la console AWS, **retirer ensuite la règle TCP 3001** du groupe de sécurité :
plus rien ne l'utilise, et le port n'est plus joignable même si Docker le mappe.

## 7. Nom de domaine et HTTPS

Let's Encrypt exige un nom de domaine (un certificat sur IP brute n'est pas
accordé par Let's Encrypt).

```bash
# 1. Dans la console AWS : Route 53 (ou votre registrar) → A record
#    shop.exemple.com  →  3.90.18.137
# 2. Sur l'instance, une fois la propagation faite :
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.exemple.com
# 3. Ouvrir le port 443 dans le groupe de sécurité
sudo certbot renew --dry-run
```

## 8. Vérifications

```bash
curl -s http://3.90.18.137/api/v1/status     # {"status":"ok",...}
curl -sI http://3.90.18.137/ | head -1       # HTTP/1.1 200 OK
docker compose ps                            # 2 services healthy
docker compose exec backend ls -1 /app/uploads | wc -l   # les photos sont bien là
curl -sI http://3.90.18.137/uploads/<fichier>.jpg
```

## 9. Mettre à jour après un `git push`

```bash
cd ~/projet_ecommerce
scp -r deploy backend/.env ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/
ssh ubuntu@3.90.18.137 'cd ~/projet_ecommerce && git pull && docker compose up -d --build'
```

Le volume n'est pas recréé : les images produits sont conservées.

## 10. Exploitation courante

```bash
docker compose ps                 # état
docker compose logs -f backend        # logs API
docker compose logs -f frontend        # logs Next.js
docker compose restart api        # redémarrer l'API seule
docker compose exec backend npx prisma migrate status
sudo tail -f /var/log/nginx/dkmarket.error.log
```

Les logs Docker sont plafonnés (`max-size: 10m`, `max-file: 3`) : le disque EBS
ne peut pas saturer. Les voir : `docker inspect dkmarket-api | grep -A3 LogPath`.

## 11. Sauvegardes

La base est sur Neon : utiliser **PITR** (Point-In-Time Recovery) ou
`pg_dump` planifié, ce n'est pas le rôle de l'instance EC2. Les photos produits
sont dans le volume Docker : les sauvegarder explicitement.

```bash
docker run --rm -v dkmarket_uploads:/data:ro -v "$PWD/backup":/backup \
  alpine:3 tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

## 12. Dépannage

| Symptôme | Cause probable | Correction |
|---|---|---|
| `502 Bad Gateway` | backend `unhealthy` (Neon injoignable) | `docker compose logs backend` |
| Produits sans photo | volume vide | `bash deploy/migrate-uploads.sh` |
| Site accessible en `:3001` mais pas en `:80` | nginx absent | `sudo bash deploy/setup-nginx.sh` |
| `nginx -t` échoue « duplicate default server » | site par défaut encore activé | `sudo rm /etc/nginx/sites-enabled/default` |
| IP changed après un arrêt | pas d'Elastic IP | associer une Elastic IP |

## 13. Paiements en production

L'intégration **Wave live** (Checkout API) est implémentée : l'acheteur est
redirigé vers Wave, qui notifie le serveur par webhook signé (HMAC-SHA256) et ne
confirme la commande que lorsque les fonds sont réellement réceptionnés.

### Checklist de mise en service Wave

1. Compte marchand **Wave Business** sur business.wave.com (pièces d'identité +
   numéro de portable marchand). Wave ne propose **pas de sandbox** : les clés
   testées touchent le portefeuille marchand — d'où un test à petit montant.
2. Générer une **clé API** (`WAVE_API_KEY`, format `wave_sn_prod_…`).
3. Exposer le webhook `POST https://votre-domaine/api/v1/payments/webhook/momo`
   en HTTPS et l'enregistrer chez Wave ; Wave fournit le **webhook secret**
   (`WAVE_WEBHOOK_SECRET`).
4. Dans `backend/.env` sur l'instance : `PAYMENT_MODE=live`, `WAVE_API_KEY`,
   `WAVE_WEBHOOK_SECRET` — champs obligatoires, l'app refuse de démarrer sans
   eux en production.
5. `docker compose up -d --force-recreate backend`, puis tester un paiement réel à
   petit montant (les URLs de retour sont construites depuis `CLIENT_URL`, donc
   `CLIENT_URL` doit être l'URL publique en HTTPS).
6. Contrôler `docker compose logs -f backend` : le statut « Payée » ne doit apparaître
   qu'après retour du webhook.

> En `live`, seuls les moyens réellement intégrés sont proposés aux acheteurs
> (Wave aujourd'hui ; Orange Money et MTN MoMo affichés « Bientôt »). Les
> **payouts** vendeurs restent `PENDING` en mode live : à traiter depuis l'espace
> admin.

## 14. Sécurité — contrôles de fin de semestre

- [ ] `backend/.env` absent du dépôt, `JWT_SECRET` régénéré (48 octets+)
- [ ] Comptes de démonstration (`admin@demo.com`, `seller@demo.com`,
      `client@demo.com`) supprimés ou mot de passe changé
- [ ] Groupe de sécurité : 22 restreint à ton IP, 80/443 ouverts, **3001 retiré**
- [ ] `ufw` actif si utilisé par nginx (`sudo ufw status`)
- [ ] HTTPS actif (le paiement Wave l'exige en production)
- [ ] Elastic IP associée
- [ ] Sauvegarde des photos produits en place (`docker volume`)