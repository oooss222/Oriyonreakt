# Diyor.tj

React + Vite frontend and Express + PostgreSQL API.

## Local development

```bash
# API (port 4000)
cd Server && npm i && npm run dev

# Frontend (port 5173)
cd client && npm i && npm run dev
```

## Production build

```bash
npm run build
npm start
```

## Deploy on Render

1. Create a **Web Service** from this repo (branch `main`).
2. Render reads `render.yaml` or use manually:
   - **Build:** `npm run build`
   - **Start:** `npm start`
3. Set env vars in Render dashboard:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — random secret
   - `CLIENT_URL` — `https://diyor.tj`
   - `CORS_ORIGIN` — `https://diyor.tj,https://www.diyor.tj,https://oriyon.store,https://www.oriyon.store`
4. Point `diyor.tj` DNS to the Render service URL.

The frontend calls `/api` on the same host (no separate DigitalOcean backend).

## Docker (this PC, phones, other apps)

One container serves the site and API together, so login and chat work from
other devices on the same Wi-Fi — not only from `localhost`.

```bash
docker compose up --build -d
```

- This computer: `http://localhost:8080`
- Phone / another device: `http://YOUR-LAN-IP:8080` (example: `http://192.168.31.26:8080`)

Postgres stays inside Docker (host port 5432 is not published, so it will not
clash with a local PostgreSQL install). Stop with `docker compose down`.
