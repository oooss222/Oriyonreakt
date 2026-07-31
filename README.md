# Oriyon.Store

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
   - `CLIENT_URL` — `https://oriyon.store`
   - `CORS_ORIGIN` — `https://oriyon.store,https://www.oriyon.store`
4. Point `oriyon.store` DNS to the Render service URL.

The frontend calls `/api` on the same host (no separate DigitalOcean backend).
