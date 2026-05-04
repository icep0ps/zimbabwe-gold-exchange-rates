# Zimbabwe Gold Exchange Rates

Simple open source tools for tracking Zimbabwe Gold (ZiG) exchange rates.

This repository contains:

- A public API for latest and historical exchange rate data
- A web application for browsing rates, history, and API documentation
- Scraper scripts used to collect and store rate data

## Project Structure

```text
.
├── api/    # Hono API, scraper scripts, database access, tests
├── web/    # React Router frontend
├── .github/workflows/
└── package.json
```

## Tech Stack

- API: Hono, TypeScript, Drizzle ORM, PostgreSQL
- Web: React Router, React, TypeScript
- Tooling: npm workspaces, Turborepo

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A PostgreSQL database

### Install Dependencies

```bash
npm install
```

### Configure Environment

Frontend:

```bash
cp web/.env.example web/.env
```

Set `VITE_API_BASE_URL` to your API URL.

Backend:

Create `api/.env` and add the environment variables your deployment uses, including your database connection string and any notification keys required by the scraper or subscription endpoints.

### Run Locally

Start both apps from the repo root:

```bash
npm run dev
```

Default local ports:

- Web: `http://localhost:5173`
- API: `http://localhost:3001`

You can also run each workspace individually:

```bash
cd api && npm run dev
cd web && npm run dev
```

## API Overview

Base path:

```text
/api/v1
```

Main endpoints:

- `GET /api/v1/rates/latest`
- `GET /api/v1/rates/:date`
- `GET /api/v1/rates/historical`
- `GET /api/v1/currencies`
- `POST /notifications/subscribe`

The frontend also includes an API documentation page at `/docs`.

## Scripts

Root:

- `npm run dev` runs the workspaces in development mode
- `npm run build` builds the workspaces

API:

- `npm run dev`
- `npm run test`
- `npm run build`

Web:

- `npm run dev`
- `npm run build`
- `npm run typecheck`

## GitHub Actions

The repository keeps a single workflow for scheduled scraping of the latest rates on weekdays. No other workflow files are currently needed.

## Contributing

Issues and pull requests are welcome. Keep changes focused, document user-facing behavior, and include tests when backend behavior changes.
