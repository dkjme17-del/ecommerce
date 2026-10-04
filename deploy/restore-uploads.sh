#!/usr/bin/env bash
# Restaure les images produits dans le volume Docker `dkmarket_uploads` a partir
# d'un dossier present sur l'hote. A lancer quand les fichiers du conteneur ont
# ete perdus (recreation du conteneur avant la mise en place du volume).
#
#   scp -r backend/uploads ubuntu@3.90.18.137:/home/ubuntu/uploads-restore
#   scp deploy/restore-uploads.sh ubuntu@3.90.18.137:/home/ubuntu/
#   ssh ubuntu@3.90.18.137 'bash ~/restore-uploads.sh /home/ubuntu/uploads-restore'

set -euo pipefail

SRC="${1:-}"
VOLUME="${VOLUME:-dkmarket_uploads}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Ce script doit etre execute en root (ou via sudo) : sudo bash $0 ${SRC:-<dossier>}" >&2
  exit 1
fi

if [ -z "$SRC" ] || [ ! -d "$SRC" ]; then
  echo "Usage : bash $0 /chemin/vers/dossier/containing/uploads" >&2
  echo "Le dossier doit contenir directement les fichiers image." >&2
  exit 1
fi

nb_src="$(find "$SRC" -type f | wc -l | tr -d '[:space:]')"
if [ "$nb_src" = "0" ]; then
  echo "Aucun fichier dans $SRC : rien a restaurer." >&2
  exit 1
fi
echo "==> $nb_src fichier(s) source dans $SRC"

if ! docker volume inspect "$VOLUME" >/dev/null 2>&1; then
  echo "==> Volume $VOLUME absent, creation"
  docker volume create "$VOLUME" >/dev/null
fi

nb_avant="$(docker run --rm -v "$VOLUME:/dst" alpine:3 sh -c "find /dst -type f | wc -l" | tr -d '[:space:]')"
echo "==> $nb_avant fichier(s) deja dans le volume $VOLUME"

echo "==> Copie vers le volume (ecrase les fichiers de meme nom, sans les supprimer)"
docker run --rm \
  -v "$VOLUME:/dst" \
  -v "$SRC:/src:ro" \
  alpine:3 sh -c 'cp -a /src/. /dst/'

nb_apres="$(docker run --rm -v "$VOLUME:/dst" alpine:3 sh -c "find /dst -type f | wc -l" | tr -d '[:space:]')"
echo "==> $nb_apres fichier(s) dans le volume apres copie"

if [ "$nb_apres" -lt "$nb_src" ]; then
  echo "ECHEC : le volume contient moins de fichiers que la source ($nb_apres < $nb_src)." >&2
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -qx dkmarket-api; then
  echo "==> Contenu visible depuis le conteneur backend :"
  docker exec dkmarket-api sh -c 'ls -1 /app/uploads | head -20' | sed 's/^/    /'
fi

echo
echo "OK. Verification depuis le navigateur :"
echo "  curl -sI http://127.0.0.1/uploads/<nom-de-fichier>.jpg"