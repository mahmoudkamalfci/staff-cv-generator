# Staff CV Generator

An internal tool for HR to generate standardized CVs for staff members to send to clients.

## Project Details

- **Implementation Time**: ~18 hours
- **Demo Link**: [https://staff-cv-generator.hakaytna.store/](https://staff-cv-generator.hakaytna.store/)
  - **Email**: `admin@cvgenerator.local`
  - **Password**: `password123`

### Assumptions Made
- The system is primarily for internal company use (not a public SaaS).

### User Roles
- **Admin**: Can add and update all resources.
- **Staff**: Can only update their profile and view their assigned projects.

## Functional Requirements

- **Staff Management**: Admin can add, update, and delete staff members.
- **Project Management**: Admin can add, update, and delete projects.
- **Assignments**: Assign staff to projects directly or add a project to a staff member from their profile.
- **Smart Suggestions**: Get suggestions for assigning staff based on matching project technologies.
- **CV Generation**: Generate a CV for a staff member using a prebuilt template or create a custom template.

### Non-Functional Requirements
- **Performance**: Fast page loads and efficient data caching (via React Query) with < 1s response times.
- **Scalability**: Architecture supports handling a growing number of staff and CV templates.
- **Security**: Secure JWT-based authentication and role-based access control.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS v4, ShadCn UI, React Query, React PDF.
- **Backend**: Node.js, Express, PostgreSQL (Prisma ORM), Zod.
- **Testing**: Jest.
- **Tooling**: Turborepo, pnpm workspaces, TypeScript.

## Architecture & Design Decisions

### Key Design Decisions
- **Frontend Caching**: Utilized React Query to efficiently cache and invalidate server state, ensuring rapid UI updates without unnecessary network requests.
- **Monorepo**: Chosen to easily share configuration, types, and logic between the frontend and backend.

### Project Structure
```text
staff-cv-generator/
├── apps/
│   ├── frontend/   # React/Vite web application
│   └── backend/    # Node.js/Express API server
└── packages/
    ├── shared/     # Shared Zod schemas and TypeScript types
    └── config/     # Shared ESLint/TS configs
```

- **Monorepo Setup**: Uses Turborepo and pnpm workspaces to manage dependencies and task orchestration.
- **Feature-Based Architecture**: The backend codebase is organized by domain features (e.g., auth, staff, cv) to promote scalability and encapsulation.

## Database ERD

![Database Schema](ERD.png)

View the interactive database ERD diagram here: [Mermaid ERD](https://mermaid.ai/d/5506dabe-3cae-489f-a32d-b76b7dd94f65)

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

To set up and manage the database, the following Prisma commands are available in the `apps/backend` (or via the root if forwarded):

- `pnpm run db:push` - Pushes the Prisma schema state to the database without generating migrations.
- `pnpm run db:migrate` - Runs `prisma migrate dev` to apply migrations to the development database.
- `pnpm run db:generate` - Runs `prisma generate` to generate the Prisma Client.
- `pnpm run db:seed` - Seeds the database with initial data using `tsx prisma/seed.ts`.

### Running the App

Run the development servers concurrently using Turbo:

```bash
pnpm run dev
```

### Testing

To run the test suite across all packages (using Jest via Turborepo), run:

```bash
pnpm test
```
