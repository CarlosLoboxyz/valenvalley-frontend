# Frontend image (SvelteKit + adapter-node). Build context: this directory.
#   docker build -t valenvalley-front .
#   docker run --rm -p 3000:3000 -e BACKEND_URL=http://host.docker.internal:8000 \
#       -e POCKETBASE_URL=http://host.docker.internal:8090 valenvalley-front
# In production this image is built and wired by the monorepo docker-compose.yml.
# All configuration is read at runtime ($env/dynamic/private); nothing is baked in.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/build ./build
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "build"]
