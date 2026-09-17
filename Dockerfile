FROM node:22.12.0-bookworm-slim AS client-build
WORKDIR /app
COPY client/package.json client/package-lock.json ./client/
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm --prefix client ci
COPY shared ./shared
COPY client ./client
ENV VITE_API_BASE=/api
RUN npm --prefix client run build

FROM node:22.12.0-bookworm-slim AS server-deps
WORKDIR /app
COPY Server/package.json Server/package-lock.json ./Server/
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm --prefix Server ci --omit=dev

FROM node:22.12.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=server-deps /app/Server/node_modules ./Server/node_modules
COPY Server ./Server
COPY shared ./shared
COPY --from=client-build /app/client/dist ./Server/public
EXPOSE 4000
CMD ["node", "Server/src/index.js"]
