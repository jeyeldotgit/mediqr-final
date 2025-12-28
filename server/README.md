## MediQR Server (Express + TypeScript)

Backend API for MediQR, implemented with Express, TypeScript, and
Supabase/PostgreSQL.

### Folder Structure

```text
src/
  config/              # Configuration files (Supabase/PostgreSQL, etc.)
    database.ts        # PostgreSQL connection pool (Supabase DB)

  controllers/         # Request handlers
  middleware/          # Express middleware (error handling, auth, etc.)
  routes/              # Route definitions
    index.ts           # Main router

  services/            # Business logic layer
  schemas/             # Zod validation schemas
  types/               # Shared TypeScript types

  db/                  # Database scripts
    migrations/        # Schema migrations
    seed/              # Seed data
    scripts/           # DB utility scripts

  app.ts               # Express app configuration
  index.ts             # Application entry point
```

### Getting Started

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure environment variables (create a `.env` file in `server/`):

```bash
SUPABASE_DB_URL=postgres://user:password@host:5432/dbname
PORT=4000
NODE_ENV=development
```

3. Run the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000/api`, with a basic
health check at `GET /api/health`.


