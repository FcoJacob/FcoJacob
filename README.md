<div align="center">

# Jacob Sarmiento — Portfolio

**Personal portfolio & CV built with Nuxt 4, Convex, and Nuxt UI**

[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00DC82?style=flat&logo=nuxt.js&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Convex](https://img.shields.io/badge/Convex-Backend-EE342F?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyeiIvPjwvc3ZnPg==)](https://convex.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![pnpm](https://img.shields.io/badge/pnpm-10.x-F69220?style=flat&logo=pnpm&logoColor=white)](https://pnpm.io)
[![License](https://img.shields.io/badge/License-MIT-slate?style=flat)](LICENSE)

[Live Site](https://jsarmiento.dev) · [CV](https://jsarmiento.dev/cv) · [Blog](https://jsarmiento.dev/blog)

</div>

---

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
git clone https://github.com/FcoJacob/fsarmiento.git
cd fsarmiento

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
npx tsx scripts/seed-cv.ts
```

---

<div align="center">

Made by **Jacob Sarmiento** — [fsarmiento.dev](https://jsarmiento.dev) · [LinkedIn](https://linkedin.com/in/fcojacob) · [GitHub](https://github.com/FcoJacob)

</div>
