# AI Product Builder

An AI-powered product development platform built with Node.js, TypeScript, Express, PostgreSQL, Drizzle ORM, and Replit Auth.

## 🚀 Features

- **AI Chat & Product Generation**: Interactive AI assistant for building products and workflows.
- **Monorepo Architecture**: Clean separation of API schemas, DB models, and client libraries using `pnpm` workspaces.
- **OpenAPI & Zod Validation**: Auto-generated type-safe API client hooks and schemas with Orval & Zod.
- **PostgreSQL & Drizzle ORM**: Type-safe database queries, schema migrations, and relational mapping.
- **Authentication**: Built-in authentication integration with Replit Auth Web SDK.

## 🛠️ Stack

- **Runtime & Language**: Node.js, TypeScript 5.9
- **Package Manager**: `pnpm` workspaces
- **Backend**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **API Spec & Codegen**: OpenAPI 3.0, Orval, Zod
- **Build Tool**: esbuild

## 📁 Repository Structure

```
├── lib/
│   ├── api-zod/          # Auto-generated Zod schemas and API types
│   ├── db/               # PostgreSQL schema definitions and Drizzle ORM setup
│   └── replit-auth-web/  # Replit authentication React hooks and utilities
├── scripts/              # Project helper scripts and build utilities
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
└── tsconfig.json         # Master TypeScript configuration
```

## 💻 Getting Started

### Prerequisites

- Node.js (v18+)
- `pnpm` (`npm install -g pnpm`)
- PostgreSQL instance (`DATABASE_URL`)

### Installation

```bash
# Install dependencies
pnpm install
```

### Development Scripts

```bash
# Run API server in development mode
pnpm --filter @workspace/api-server run dev

# Run full typecheck across all workspace packages
pnpm run typecheck

# Build all workspace packages
pnpm run build

# Regenerate Zod schemas and API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push database schema changes (development)
pnpm --filter @workspace/db run push
```

## 📄 License

MIT
