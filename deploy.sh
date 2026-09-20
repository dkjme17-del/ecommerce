#!/usr/bin/env bash
# Script de déploiement / mise à jour — Ubuntu (voir docs/DEPLOYMENT.md)
set -euo pipefail

APP_DIR="/var/www/ecommerce"

echo "==> Mise à jour du code"
cd "$APP_DIR"
git pull

echo "==> Backend"
cd "$APP_DIR/backend"
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
sudo systemctl restart ecommerce-api

echo "==> Frontend"
cd "$APP_DIR/frontend"
npm ci
npm run build
sudo systemctl restart ecommerce-web

echo "==> Déploiement terminé"
echo "    (premier déploiement uniquement : npm run seed pour les comptes démo —"
echo "     ne pas exécuter en production réelle)"