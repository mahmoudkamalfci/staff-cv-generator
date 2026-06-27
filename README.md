# Staff CV Generator

An internal tool for HR to generate standardized CVs for staff members to send to clients.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, Radix UI, React Query, React PDF.
- **Backend**: Node.js, Express, PostgreSQL (Prisma ORM), Zod.
- **Tooling**: Turborepo, pnpm workspaces, TypeScript.

## Architecture

- **Monorepo**: This project uses Turborepo and pnpm workspaces to manage `apps/` (frontend, backend) and `packages/` (shared config, types/utils).
- **Feature-Based Architecture**: The codebase (especially the backend) is organized by domain features (e.g., auth, staff, cv) to promote scalability and encapsulation.

## Database ERD

View the database ERD diagram here: [Mermaid ERD](https://mermaid.ai/d/5506dabe-3cae-489f-a32d-b76b7dd94f65)

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- PostgreSQL database instance

### Installation
```bash
pnpm install
```

### Environment Setup
Copy `.env.example` to `.env` in the respective apps and configure your database URL.

### Database Setup
To set up the database, run the following from the root or backend directory:
```bash
pnpm run db:push
```

### Running the App
Run the development servers concurrently using Turbo:
```bash
pnpm run dev
```
