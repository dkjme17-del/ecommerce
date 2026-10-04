#!/usr/bin/env bash
# Mise à jour de DKmarket sur l'instance AWS (voir docs/DEPLOYMENT.md).
# Le volume dkmarket_uploads n'est pas recree : les images produits sont
# conservees. Les migrations Prisma sont appliquees par le CMD du conteneur.
#
#   scp -r deploy backend/.env ubuntu@3.90.18.137:/home/ubuntu/projet_ecommerce/
#   ssh ubuntu@3.90.18.137 'bash ~/projet_ecommerce/deploy.sh'

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/projet_ecommerce}"
cd "$APP_DIR"

echo "==> Mise a jour du code"
git pull --ff-only

echo "==> Reconstruction et redemarrage de la stack"
docker compose up -d --build --remove-orphans

echo "==> Attente de l'etat de sante des conteneurs"
for i in $(seq 1 30); do
  unhealthy="$(docker compose ps --format '{{.Name}} {{.Health}}' \
    | awk '$2 != "healthy" && NR > 0' | wc -l)"
  if [ "$unhealthy" -eq 0 ]; then
    break
  fi
  sleep 5
done

docker compose ps

echo "==> Verification"
curl -fsS -o /dev/null -w "    site  HTTP %{http_code}\n" http://127.0.0.1/
curl -fsS -w "\n" http://127.0.0.1/api/v1/status | sed 's/^/    api   /'

echo
echo "Deploiement termine."
echo "    Si la base est vide : cd backend && node prisma/seed.js"
echo "    (ne pas executer le seed sur une base de production reelle)"