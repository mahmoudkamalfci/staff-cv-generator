# README Expansion Design Specification

## 1. Overview
**Topic**: Expanding project README documentation.
**Purpose**: To add missing critical details such as Design Decisions, Assumptions, Project Structure, and Non-Functional Requirements.

## 2. Design Layout

### 2.1 Project Details (Updated)
Add **Assumptions Made**:
- The system is primarily for internal company use (not a public SaaS).

### 2.2 Features & Requirements (Updated)
Rename "Features" to **Functional Requirements** and include the existing list of features.
Add **Non-Functional Requirements**:
- **Performance**: Fast page loads and efficient data caching (via React Query) with < 1s response times.
- **Scalability**: Architecture supports handling a growing number of staff and CV templates.
- **Security**: Secure JWT-based authentication and role-based access control.

### 2.3 Architecture & Design Decisions (Updated)
Rename "Architecture" to **Architecture & Design Decisions**.
Add **Key Design Decisions**:
- **Frontend Caching**: Utilized React Query to efficiently cache and invalidate server state, ensuring rapid UI updates without unnecessary network requests.
- **Monorepo**: Chosen to easily share configuration, types, and logic between the frontend and backend.

Add **Project Structure**:
```
staff-cv-generator/
├── apps/
│   ├── frontend/   # React/Vite web application
│   └── backend/    # Node.js/Express API server
└── packages/
    ├── shared/     # Shared Zod schemas and TypeScript types
    └── config/     # Shared ESLint/TS configs
```
