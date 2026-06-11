# Project Overview: Reel-Boost (talklive_Backend)

## Project Summary
- A Node.js backend for a live/social media app (reel/streams, chat, payments, gifts, feeds, ecommerce features).
- Uses Express, Sequelize (Postgres), Socket.io for realtime, file uploads, and integrations (Stripe, Twilio, AWS S3).

## Tech Stack
- Node.js + Express
- Database: PostgreSQL (via `sequelize`)
- Realtime: `socket.io`
- File uploads: `multer`, stored under `/uploads`
- Media processing: `fluent-ffmpeg`, `ffmpeg-static`
- Auth: `jsonwebtoken` (JWT)
- Payments: `stripe`, `twilio` for comms
- Other: `axios`, `nodemailer`, `node-cron`

## Repo Structure (high level)
- `index.js` – application entrypoint and server bootstrap
- `package.json` – dependencies and `dev` script
- `config/config.js` – Sequelize DB configuration (reads from `.env`)
- `models/` – Sequelize models (User, Feed, Chat, etc.)
- `src/controller/` – route controllers and business logic
- `src/routes/` – route definitions (see `src/routes/index.routes.js`)
- `src/service/` – services and repositories
- `src/middleware/` – authentication, upload middleware
- `public/`, `admin/` – static site/admin UI served by the server
- `uploads/` – uploaded files (avatars, chat media, reels, etc.)

## Important Files
- [package.json](package.json)
- [index.js](index.js)
- [config/config.js](config/config.js)
- [src/routes/index.routes.js](src/routes/index.routes.js)
- [src/middleware/authMiddleware.js](src/middleware/authMiddleware.js)
- [models/](models/)

## Routes and Features (overview)
- Main router mounts many feature routers under `/api` via `src/routes/index.routes.js`:
  - `/api/users`, `/api/social`, `/api/follow`, `/api/block`, `/api/report`
  - `/api/like`, `/api/save`, `/api/comment`, `/api/chat`, `/api/live`, `/api/feed`
  - `/api/ecommerce`, `/api/music`, `/api/gift`, `/api/transaction`, `/api/payment`
  - Admin and config endpoints under `/api/admin` and `/api/project_conf`
- Realtime socket path is configured at `/socket`.
- Static admin UI served from `/admin` and catch-all routes return `admin/index.html`.

## Environment Variables (expected)
Based on `config/config.js` and `index.js`, the project expects at least:
- `DB_HOST`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `Port` (server port)
- Any keys for AWS, Stripe, Twilio, JWT secret, SMTP, etc. (check `.env` for full list in your environment)

## Run / Development
- Install dependencies:

```bash
npm install
```

- Start in development (nodemon):

```bash
npm run dev
```

- The entrypoint is `index.js`; it syncs Sequelize models then starts the HTTP + socket server.

## Database
- Uses Sequelize with Postgres (see `config/config.js`).
- `db.sequelize.sync({ alter: false })` runs on startup — ensure database exists and `.env` values are correct.

## Notable Implementation Details
- Custom multipart handling in `index.js` selectively applies `multer` uploads for feed/chat routes.
- Socket authentication middleware is used (`soketAuthMiddleware`).
- Admin static files are served from `/admin` folder.

## Suggested Next Steps / Improvements
- Add a minimal `README.md` with quickstart and `.env.example` file listing required variables.
- Add tests for critical controllers and a simple CI workflow (GitHub Actions) running lint/tests.
- Consider moving sensitive config keys into a documented `.env.example` and avoid committing secrets.
- Add API documentation (Swagger or Postman collection) for public endpoints.

---

If you want, I can:
- Generate a `README.md` and `.env.example` next.
- Produce a Swagger/OpenAPI spec for the routes.
- Create a concise admin-run checklist for deployment.

