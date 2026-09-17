# Portfolio — Development Guide

**Personal portfolio & CV built with Nuxt 4, Convex, and Nuxt UI**

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Convex](https://img.shields.io/badge/Convex-Backend-EE342F?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==)](https://convex.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io)
[![License](https://img.shields.io/badge/License-MIT-slate?style=flat)](../LICENSE)

[Live Site](https://jsarmiento.dev) · [CV](https://jsarmiento.dev/cv) · [Blog](https://jsarmiento.dev/blog)

## Overview

Full-stack personal portfolio with blog, project showcase, labs section, and an interactive PDF CV. Built with a **Nuxt Layers** architecture to separate concerns cleanly, powered by a **Convex** real-time backend and protected by an **OAuth admin panel**.

## Features

- **Portfolio** — Skills, project carousel, and a downloadable PDF CV
- **Blog** — Multilingual posts (ES / EN) managed from the admin panel
- **Labs** — Experimental projects section
- **Admin Panel** — Protected CRUD for all content (blogs, projects, labs, CV)
- **i18n** — Full Spanish / English support
- **SEO** — Sitemap, robots.txt, Open Graph, hreflang, and JSON-LD structured data
- **Dark mode** — System-aware with manual toggle
- **PDF export** — ATS-friendly, text-based CV generated with `jsPDF`, served at [`/cv.pdf`](https://jsarmiento.dev/cv.pdf)
- **OAuth login** — Google via `nuxt-auth-utils`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) + [Vue 3](https://vuejs.org) |
| UI | [Nuxt UI 4](https://ui.nuxt.com) + [Tailwind CSS 4](https://tailwindcss.com) |
| Backend | [Convex](https://convex.dev) (real-time database + serverless functions) |
| Auth | [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (Google) |
| i18n | [@nuxtjs/i18n](https://i18n.nuxtjs.org) |
| SEO | [@nuxtjs/sitemap](https://nuxtseo.com/docs/sitemap) + [@nuxtjs/robots](https://nuxtseo.com/docs/robots) |
| Testing | [Vitest](https://vitest.dev) + [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing) |
| Linting | ESLint + Prettier |
| Package manager | [pnpm 10](https://pnpm.io) |

## Architecture — Nuxt Layers

```
layers/
├── base/        # Shared layout, styles (Tailwind), i18n, ESLint config
├── public/      # Public-facing pages: home, blog, projects, labs, CV
└── admin/       # Protected admin panel: auth middleware, CRUD pages
```

Convex functions and schema live in `convex/`, and Nuxt server routes in `server/` provide a thin API layer on top.

## Project Structure

```
.
├── app/                   # Root app entry (app.vue)
├── convex/                # Convex schema & server functions
│   ├── schema.ts
│   ├── blogs.ts
│   ├── projects.ts
│   ├── labs.ts
│   └── cv.ts
├── layers/
│   ├── base/              # Shared: layout, CSS, composables, i18n
│   ├── public/            # Public pages & project carousel component
│   └── admin/             # Admin pages, middleware, composables
├── server/                # Nuxt server routes & API handlers
│   ├── api/
│   ├── routes/auth/       # OAuth callback (Google)
│   └── routes/cv.pdf.get.ts  # ATS-friendly PDF CV endpoint
├── shared/                # Code shared between app and server (CV PDF renderer)
├── tests/                 # Vitest unit tests
└── scripts/               # Seed scripts (e.g. CV data)
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm 10
- A [Convex](https://dashboard.convex.dev) project

### Installation

```bash
# Clone the repo
git clone https://github.com/FcoJacob/FcoJacob.git portfolio
cd portfolio

# Install dependencies
pnpm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Convex — local development (read at build time)
CONVEX_URL=https://<your-deployment>.convex.cloud

# Convex — Vercel production/preview (overrides runtimeConfig at runtime)
# Set this in Vercel dashboard: Settings > Environment Variables
NUXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud

# OAuth — Google
NUXT_OAUTH_GOOGLE_CLIENT_ID=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=

# Comma-separated list of emails allowed to access the admin panel
NUXT_ADMIN_EMAILS=

# Session secret (min 32 chars)
NUXT_SESSION_PASSWORD=
```

### Development

```bash
# Start Convex dev server (separate terminal)
npx convex dev

# Start Nuxt dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build & Preview

```bash
pnpm build
pnpm preview
```

### Tests

```bash
pnpm test          # Run once
pnpm test:watch    # Watch mode
```

### Linting

```bash
pnpm lint          # Check
pnpm lint:fix      # Auto-fix
```

## Seed Data

To populate the Convex database with initial CV data:

```bash
node scripts/seed-cv.ts
```

## Chatbot (chapi-ai)

The floating chat launcher (bottom corner, all public pages) is [`chapi-ai`](https://www.npmjs.com/package/chapi-ai) `^0.3.0`: a RAG chatbot answering strictly from the site's own CV — never from the model's general knowledge.

- **Persona**: `fsarmiento` — answers in first person as Jacob, in Spanish, in a friendly tone aimed at recruiters.
- **Chat provider**: Groq (`openai/gpt-oss-20b`). Embeddings: Voyage AI.
- **Knowledge source**: the live [`/cv.pdf`](https://jsarmiento.dev/cv.pdf) endpoint (same Convex `cv` data as the `/cv` page) — not a separate/duplicated PDF, so the chatbot never drifts from the published CV.
- **Why ingestion is split from serving**: `ingestPdf` (PDF parsing, via `unpdf`) uses a Worker internally, which Convex's default V8 action runtime doesn't support. `convex/chapiIngest.ts` runs the ingestion in the Node action runtime (`"use node"`) and persists the resulting embedded chunks to the `chapiKnowledge` table; `convex/http.ts` (`POST /chat`, default runtime) only ever reads those chunks and builds the bot per request — no PDF parsing at request time.
- **Supplemental facts**: `convex/chapiSupplementalFacts.ts` holds facts that shouldn't appear on the public, downloadable CV but that the chatbot should still be able to answer (e.g. Jacob's legal name). Since 0.3.0, these go straight through `chapi-ai`'s `ingestText` — no more routing them through a throwaway PDF via `ingestPdf`.
- **Keeping it in sync**: a daily cron (`convex/crons.ts`) re-runs `chapiIngest:ingest`. Run it manually after editing the CV: `npx convex run chapiIngest:ingest`.
- **Required Convex env vars** (`npx convex env set <NAME> <value>`, not in `.env` — Convex functions don't read the project's local `.env`): `GROQ_API_KEY`, `VOYAGE_API_KEY`.
- **CORS**: the widget calls `*.convex.site/chat` from the browser (a different origin than the site itself). Since 0.3.0, `convex/http.ts` uses `chapi-ai/adapters/cors`'s `withCors` instead of hand-rolled CORS headers — a wildcard origin is safe here since the endpoint is public and unauthenticated. Convex's router still dispatches by method+path, so `/chat` is registered for both `POST` and `OPTIONS` against the same handler.
