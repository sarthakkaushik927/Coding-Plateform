# Coding Platform

Full-stack coding assessment platform with a Vite/React frontend and Express/MongoDB backend.

## Deployment Configuration

Backend environment variables live in `Backend/.env` and are documented in `Backend/.env.example`.

Required for production:
- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

Common backend variables:
- `PORT`: provided automatically by most hosts, defaults to `5000` locally.
- `CORS_ORIGIN`: comma-separated frontend origins, for example `https://app.example.com`.
- `EMAIL_SERVICE`: defaults to `gmail`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`: use these instead of `EMAIL_SERVICE` for custom SMTP.

Frontend environment variables live in `frontend/.env` and are documented in `frontend/.env.example`.

Required only when frontend and backend are on different origins:
- `VITE_API_BASE_URL=https://your-backend-domain.com/api`

If `VITE_API_BASE_URL` is not set in production, the frontend uses same-origin `/api`.

## Local Development

```bash
cd Backend
npm install
cp .env.example .env
npm run dev
```

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Production Build

Backend:

```bash
cd Backend
npm ci --omit=dev
npm start
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

The backend exposes `GET /health` for platform health checks.

## Authentication

Users create accounts with name, email, and password, then verify the account with an email OTP.
Login requires email and password.
Forgot password uses a separate email OTP and lets the user set a new password.
