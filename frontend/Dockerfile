FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Les rewrites de next.config.mjs sont figes au build : l'URL de l'API doit
# etre connue ici, sinon le proxy /api vise localhost dans le conteneur.
ARG API_URL=http://backend:4000
ENV API_URL=$API_URL

RUN npm run build


FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]