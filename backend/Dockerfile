FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Neon (et tout pooled Postgres) peut refuser la connexion juste apres une
# periode d'inactivite : on retente la migration avant de demarrer le serveur,
# sinon le conteneur meurt sur un P1001 transitoire.
# CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
CMD ["sh", "-c", "for i in 1 2 3 4 5; do npx prisma migrate deploy && break; echo \"Migration echouee (essai $i/5), nouvelle tentative dans 10s\"; sleep 10; done; exec node src/server.js"]