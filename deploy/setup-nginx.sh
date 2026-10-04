#!/usr/bin/env bash
# Installe et active le reverse proxy nginx pour DKmarket sur l'instance AWS.
# Idempotent : peut etre relance sans effet de bord.
#
#   scp -r deploy ubuntu@<ip>:/tmp/ && ssh ubuntu@<ip> 'sudo bash /tmp/deploy/setup-nginx.sh'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF_SRC="$SCRIPT_DIR/nginx/dkmarket.conf"
CONF_DST="/etc/nginx/sites-available/dkmarket"
SITE_LINK="/etc/nginx/sites-enabled/dkmarket"

if [ "$(id -u)" -ne 0 ]; then
  echo "Ce script doit etre execute en root : sudo bash $0" >&2
  exit 1
fi

if [ ! -f "$CONF_SRC" ]; then
  echo "Config introuvable : $CONF_SRC" >&2
  exit 1
fi

echo "==> Verification du conteneur frontend sur 127.0.0.1:3001"
if curl -fsS -o /dev/null --max-time 10 http://127.0.0.1:3001/; then
  echo "    OK, le frontend repond."
else
  echo "    ATTENTION : rien ne repond sur 127.0.0.1:3001." >&2
  echo "    Verifiez que docker-compose.yml mappe bien 127.0.0.1:3001:3000" >&2
  echo "    et que le conteneur dkmarket-web est demarre." >&2
fi

echo "==> Installation de nginx"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx

echo "==> Installation de la configuration"
mkdir -p /var/www/certbot
cp "$CONF_SRC" "$CONF_DST"

# Le site par defaut d'Ubuntu ecoute aussi le port 80 : deux blocs
# default_server sur la meme adresse font echouer `nginx -t`.
rm -f /etc/nginx/sites-enabled/default

echo "==> Activation du site"
ln -sfn "$CONF_DST" "$SITE_LINK"

echo "==> Test de la configuration"
if ! nginx -t; then
  echo "ECHEC : configuration invalide, aucune modification appliquee." >&2
  exit 1
fi

echo "==> Rechargement de nginx"
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  echo "==> Ouverture du port 80 dans ufw"
  ufw allow 'Nginx Full' >/dev/null
fi

echo
echo "OK. Le site repond sur :"
curl -sS -o /dev/null -w "    http://127.0.0.1/  -> HTTP %{http_code}\n" http://127.0.0.1/
echo
echo "Reste a faire dans la console AWS :"
echo "  - Groupe de securite : autoriser le trafic entrant TCP 80 (0.0.0.0/0)"
echo "  - Groupe de securite : RETIRER la regle TCP 3001 (plus necessaire)"
echo "  - Associer une Elastic IP pour que l'URL ne change pas"
echo "  - Verifier le port 443 si vous ajoutez HTTPS"