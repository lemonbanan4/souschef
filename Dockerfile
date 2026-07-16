# Build stage — compile the Vite app + service worker
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage — the standalone server runs the project's TypeScript natively (Node >= 23)
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# The kitchen API imports shared prompt-building code from src/
COPY server ./server
COPY src ./src
EXPOSE 8787
CMD ["node", "server/standalone.ts"]
