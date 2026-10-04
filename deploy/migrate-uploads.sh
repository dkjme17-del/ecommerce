#!/usr/bin/env bash
# Migre les images produits deja presentes dans le conteneur backend vers le
# volume Docker `dkmarket_uploads`, avant de recrire les conteneurs.
#
# A EXECUTER UNE SEULE FOIS sur l'instance AWS, avant le premier `docker compose up -d --build`
# avec le nouveau docker-compose.yml. Sans cela, tous les fichiers envoyes par
# les vendeurs (photos produits) seraient perdus.
#
#   scp deploy/migrate-uploads.sh ubuntu@<ip>:/tmp/ && ssh ubuntu@<ip> 'bash /tmp/migrate-uploads.sh'

set -euo pipefail

CONTAINER="${CONTAINER:-dkmarket-api}"
VOLUME="${VOLUME:-dkmarket_uploads}"
SRC="/app/uploads"
SEED_DIR="/tmp/dkmarket-uploads-seed"

if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Conteneur '$CONTAINER' introuvable : rien a migrer."
  exit 0
fi

count_in_container() {
  docker exec "$CONTAINER" sh -c "find '$SRC' -type f 2>/dev/null | wc -l" | tr -d '[:space:]'
}

nb_in_container="$(count_in_container)"
if [ "$nb_in_container" = "0" ]; then
  echo "Aucun fichier dans $CONTAINER:$SRC : migration inutile."
  exit 0
fi

echo "==> $nb_in_container fichier(s) trouve(s) dans $CONTAINER:$SRC"

echo "==> Copie vers $SEED_DIR"
rm -rf "$SEED_DIR"
mkdir -p "$SEED_DIR"
docker cp "$CONTAINER:$SRC/." "$SEED_DIR/"

nb_seed="$(find "$SEED_DIR" -type f | wc -l | tr -d '[:space:]')"
echo "==> $nb_seed fichier(s) copies sur le disque de l'hote"

if [ "$nb_seed" != "$nb_in_container" ]; then
  echo "ECHEC : $nb_seed != $nb_in_container, la copie est incomplete. Abandon." >&2
  exit 1
fi

echo "==> Creation du volume $VOLUME (si absent)"
docker volume create "$VOLUME" >/dev/null

echo "==> Remplissage du volume"
docker run --rm \
  -v "$VOLUME:/dst" \
  -v "$SEED_DIR:/src:ro" \
  alpine:3 sh -c 'cp -a /src/. /dst/'

nb_volume="$(docker run --rm -v "$VOLUME:/dst" alpine:3 sh -c "find /dst -type f | wc -l" | tr -d '[:space:]')"
echo "==> $nb_volume fichier(s) dans le volume $VOLUME"

if [ "$nb_volume" -lt "$nb_seed" ]; then
  echo "ECHEC : le volume ne contient pas tous les fichiers ($nb_volume < $nb_seed)." >&2
  exit 1
fi

echo
echo "OK. Les sauvegardes de secours restent dans $SEED_DIR"
echo "Prochaine etape : cd <dossier du projet> && docker compose up -d --build"
echo "Verification : docker compose exec backend ls -1 /app/uploads | wc -l"