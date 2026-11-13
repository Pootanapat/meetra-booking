FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci \
    && npm rebuild sqlite3 --build-from-source

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

COPY --from=build /app /app

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]

