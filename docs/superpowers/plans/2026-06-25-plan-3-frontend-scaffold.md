# CV Generator — Plan 3: Frontend Scaffold, Design System & Auth

## ⚡ Best Practice Updates (Applied from Vercel React Review)

- Fix 1 (P0): `bundle-barrel-imports` — Added `optimizeDeps.include` for lucide-react in vite.config.ts
- Fix 2 (P0): `rendering-hoist-jsx` — PageLoader fallback hoisted to module-level constant `PAGE_FALLBACK`
- Fix 3 (P1): `client-localstorage-schema` — Dark mode persisted to versioned `localStorage` key
- Fix 4 (P1): `rendering-animate-svg-wrapper` — Spinner animation moved to wrapper div for GPU compositing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the React + Vite + TypeScript frontend with Tailwind v4 design system, shadcn/ui components, Axios API client with JWT interceptors, auth context, and the full app shell (sidebar + topbar layout).

**Architecture:** Vite + React 18 + TypeScript. Tailwind v4 CSS-first `@theme` block in `index.css` with OKLCH semantic tokens and dark mode. shadcn/ui for component primitives. React Router v6 for navigation. Axios with request/response interceptors handles JWT access token refresh transparently. Auth state in React context. All API types come from `@cv-generator/shared`.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS v4, shadcn/ui, React Router v6, Axios, @tanstack/react-query v5, react-hook-form, @hookform/resolvers/zod, lucide-react

## Global Constraints

- Frontend runs on port 5173 (`npm run dev` / `vite`)
- Backend URL: `http://localhost:3001` (via `VITE_API_URL` env var)
- All imports use `.tsx`/`.ts` extensions (not needed with Vite bundler resolution, omit extensions)
- Components use named exports (not default exports except pages)
- Use `cn()` utility (from `lib/utils.ts`) for conditional classNames
- All forms validated with Zod schemas from `@cv-generator/shared` + react-hook-form
- Dark mode via `.dark` class on `<html>` (Tailwind v4 `@custom-variant`)
- Inter font loaded from Google Fonts

---

### Task 1: Vite + React + TypeScript App Scaffold

**Files:**

- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/tsconfig.app.json`
- Create: `apps/frontend/tsconfig.node.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/eslint.config.js`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/App.tsx`
- Create: `apps/frontend/.env.example`
- Create: `apps/frontend/src/vite-env.d.ts`

**Interfaces:**

- Produces: Running Vite dev server at `http://localhost:5173` with a blank React app

- [ ] **Step 1: Replace `apps/frontend/package.json`**

```json
{
  "name": "@cv-generator/frontend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@cv-generator/shared": "workspace:*",
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@tanstack/react-query": "^5.50.0",
    "axios": "^1.7.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.400.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.52.0",
    "react-router-dom": "^6.24.0",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@cv-generator/config": "workspace:*",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 2: Create `apps/frontend/tsconfig.json`**

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `apps/frontend/tsconfig.app.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `apps/frontend/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: Create `apps/frontend/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle lucide-react to avoid barrel import cost (~2.8s cold start hit)
    include: ['lucide-react'],
  },
});
```

- [ ] **Step 6: Create `apps/frontend/eslint.config.js`**

```js
import { eslintConfig } from '@cv-generator/config';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...eslintConfig,
  {
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
```

- [ ] **Step 7: Create `apps/frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="GISCON internal staff CV generation tool for technical proposals"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <title>GISCON CV Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `apps/frontend/.env.example`**

```env
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 9: Create `apps/frontend/src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 10: Create `apps/frontend/src/main.tsx`** (placeholder, will be replaced in Task 3)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif' }}>
      <h1>GISCON CV Generator</h1>
      <p>Frontend scaffold — design system coming next.</p>
    </div>
  </React.StrictMode>,
);
```

- [ ] **Step 11: Install dependencies**

```bash
pnpm install --filter @cv-generator/frontend
```

- [ ] **Step 12: Copy `.env.example` to `.env`**

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

- [ ] **Step 13: Verify dev server starts**

```bash
pnpm --filter @cv-generator/frontend dev
```

Expected: Vite dev server running at `http://localhost:5173`.

- [ ] **Step 14: Commit**

```bash
git add apps/frontend
git commit -m "feat(frontend): scaffold Vite + React + TypeScript app"
```

---

### Task 2: Tailwind v4 Design System

**Files:**

- Create: `apps/frontend/src/index.css`
- Create: `apps/frontend/src/lib/utils.ts`

**Interfaces:**

- Produces:
  - `cn(...inputs)` — className merger utility exported from `src/lib/utils.ts`
  - Full Tailwind v4 `@theme` with OKLCH semantic color tokens, dark mode, animations, and typography

- [ ] **Step 1: Create `apps/frontend/src/index.css`**

```css
@import 'tailwindcss';

/* ============================================================
   THEME — Tailwind v4 CSS-first configuration
   Uses OKLCH for perceptually uniform color
   ============================================================ */
@theme {
  /* --- Typography --- */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* --- Semantic Color Tokens (Light Mode) --- */
  --color-background: oklch(98% 0.005 264);
  --color-foreground: oklch(13% 0.025 264);

  --color-primary: oklch(27% 0.06 250);
  --color-primary-hover: oklch(22% 0.07 250);
  --color-primary-foreground: oklch(98% 0.005 264);

  --color-secondary: oklch(94% 0.012 264);
  --color-secondary-hover: oklch(90% 0.015 264);
  --color-secondary-foreground: oklch(20% 0.03 264);

  --color-muted: oklch(93% 0.008 264);
  --color-muted-foreground: oklch(48% 0.02 264);

  --color-accent: oklch(56% 0.18 250);
  --color-accent-hover: oklch(50% 0.2 250);
  --color-accent-foreground: oklch(98% 0.005 264);

  --color-destructive: oklch(54% 0.22 27);
  --color-destructive-foreground: oklch(98% 0.005 264);

  --color-success: oklch(55% 0.16 145);
  --color-success-foreground: oklch(98% 0.005 264);

  --color-warning: oklch(72% 0.18 70);
  --color-warning-foreground: oklch(13% 0.025 264);

  --color-border: oklch(88% 0.01 264);
  --color-input: oklch(88% 0.01 264);
  --color-ring: oklch(56% 0.18 250);

  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(13% 0.025 264);

  --color-popover: oklch(100% 0 0);
  --color-popover-foreground: oklch(13% 0.025 264);

  --color-sidebar: oklch(15% 0.03 250);
  --color-sidebar-foreground: oklch(90% 0.01 264);
  --color-sidebar-border: oklch(22% 0.04 250);
  --color-sidebar-active: oklch(56% 0.18 250);
  --color-sidebar-muted: oklch(60% 0.015 264);

  /* --- Border Radius --- */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;

  /* --- Shadows --- */
  --shadow-card: 0 1px 3px 0 oklch(0% 0 0 / 0.08), 0 1px 2px -1px oklch(0% 0 0 / 0.06);
  --shadow-elevated: 0 4px 16px -2px oklch(0% 0 0 / 0.1), 0 2px 6px -2px oklch(0% 0 0 / 0.06);
  --shadow-modal: 0 20px 60px -8px oklch(0% 0 0 / 0.2);

  /* --- Animations --- */
  --animate-fade-in: fade-in 0.18s ease-out;
  --animate-fade-out: fade-out 0.15s ease-in;
  --animate-slide-in-up: slide-in-up 0.22s ease-out;
  --animate-slide-in-right: slide-in-right 0.22s ease-out;
  --animate-scale-in: scale-in 0.15s ease-out;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  @keyframes slide-in-up {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes slide-in-right {
    from {
      transform: translateX(-8px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes scale-in {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
}

/* ============================================================
   DARK MODE — class-based via @custom-variant
   ============================================================ */
@custom-variant dark (&:where(.dark, .dark *));

.dark {
  --color-background: oklch(13% 0.025 264);
  --color-foreground: oklch(95% 0.008 264);

  --color-primary: oklch(72% 0.12 250);
  --color-primary-hover: oklch(78% 0.13 250);
  --color-primary-foreground: oklch(13% 0.025 264);

  --color-secondary: oklch(20% 0.03 264);
  --color-secondary-hover: oklch(24% 0.035 264);
  --color-secondary-foreground: oklch(90% 0.01 264);

  --color-muted: oklch(20% 0.028 264);
  --color-muted-foreground: oklch(62% 0.018 264);

  --color-accent: oklch(62% 0.2 250);
  --color-accent-hover: oklch(67% 0.21 250);
  --color-accent-foreground: oklch(13% 0.025 264);

  --color-destructive: oklch(46% 0.17 27);
  --color-destructive-foreground: oklch(95% 0.008 264);

  --color-success: oklch(50% 0.13 145);
  --color-success-foreground: oklch(95% 0.008 264);

  --color-warning: oklch(66% 0.15 70);
  --color-warning-foreground: oklch(13% 0.025 264);

  --color-border: oklch(24% 0.03 264);
  --color-input: oklch(24% 0.03 264);
  --color-ring: oklch(62% 0.2 250);

  --color-card: oklch(16% 0.028 264);
  --color-card-foreground: oklch(95% 0.008 264);

  --color-popover: oklch(16% 0.028 264);
  --color-popover-foreground: oklch(95% 0.008 264);

  --color-sidebar: oklch(10% 0.02 264);
  --color-sidebar-foreground: oklch(88% 0.01 264);
  --color-sidebar-border: oklch(18% 0.03 264);
  --color-sidebar-active: oklch(62% 0.2 250);
  --color-sidebar-muted: oklch(55% 0.012 264);

  --shadow-card: 0 1px 3px 0 oklch(0% 0 0 / 0.3), 0 1px 2px -1px oklch(0% 0 0 / 0.2);
  --shadow-elevated: 0 4px 16px -2px oklch(0% 0 0 / 0.4), 0 2px 6px -2px oklch(0% 0 0 / 0.3);
}

/* ============================================================
   BASE STYLES
   ============================================================ */
@layer base {
  *,
  *::before,
  *::after {
    @apply border-border box-border;
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    @apply bg-background text-foreground font-sans antialiased;
    line-height: 1.6;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    @apply font-semibold leading-tight tracking-tight;
  }

  /* Focus ring */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground;
  }
}

/* ============================================================
   PRINT STYLES — for CV printing
   ============================================================ */
@media print {
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }

  body {
    background: white !important;
    color: black !important;
    font-size: 11pt;
  }

  @page {
    margin: 1.5cm 2cm;
    size: A4;
  }
}
```

- [ ] **Step 2: Create `apps/frontend/src/lib/utils.ts`**

```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Present';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
```

- [ ] **Step 3: Update `apps/frontend/src/main.tsx`** to import the CSS

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">GISCON CV Generator</h1>
        <p className="text-muted-foreground">Design system loaded ✓</p>
        <div className="flex gap-2 justify-center">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm">
            Primary
          </span>
          <span className="px-3 py-1 bg-accent text-accent-foreground rounded-lg text-sm">
            Accent
          </span>
          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-sm">Muted</span>
        </div>
      </div>
    </div>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Verify Tailwind tokens render correctly**

```bash
pnpm --filter @cv-generator/frontend dev
```

Visit `http://localhost:5173` — should show styled heading with colored badges. No unstyled text.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/index.css apps/frontend/src/lib/utils.ts
git commit -m "feat(frontend): add Tailwind v4 design system with OKLCH tokens and dark mode"
```

---

### Task 3: shadcn/ui Component Installation

**Files:**

- Create: `apps/frontend/components.json`
- Create: `apps/frontend/src/components/ui/button.tsx`
- Create: `apps/frontend/src/components/ui/card.tsx`
- Create: `apps/frontend/src/components/ui/input.tsx`
- Create: `apps/frontend/src/components/ui/label.tsx`
- Create: `apps/frontend/src/components/ui/select.tsx`
- Create: `apps/frontend/src/components/ui/badge.tsx`
- Create: `apps/frontend/src/components/ui/avatar.tsx`
- Create: `apps/frontend/src/components/ui/dialog.tsx`
- Create: `apps/frontend/src/components/ui/toast.tsx`
- Create: `apps/frontend/src/components/ui/toaster.tsx`
- Create: `apps/frontend/src/components/ui/separator.tsx`
- Create: `apps/frontend/src/components/ui/skeleton.tsx`
- Create: `apps/frontend/src/components/ui/tabs.tsx`
- Create: `apps/frontend/src/components/ui/dropdown-menu.tsx`
- Create: `apps/frontend/src/components/ui/tooltip.tsx`
- Create: `apps/frontend/src/hooks/use-toast.ts`

**Interfaces:**

- Produces: All shadcn/ui components ready to import from `@/components/ui/*`

- [ ] **Step 1: Create `apps/frontend/components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 2: Install shadcn/ui components via CLI**

Run from `apps/frontend/`:

```bash
cd apps/frontend
npx shadcn@latest add button card input label select badge avatar dialog toast separator skeleton tabs dropdown-menu tooltip --yes
```

This will create all component files in `src/components/ui/` automatically.

If the CLI fails due to Tailwind v4, manually create components using Radix primitives (see Step 3 for the Button as a template).

- [ ] **Step 3: Verify Button component was created at `apps/frontend/src/components/ui/button.tsx`**

The file should look like:

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        outline: 'border border-input bg-background hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-accent underline-offset-4 hover:underline',
        accent: 'bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

If the CLI created a different version, keep it — just ensure it uses our `cn()` and design tokens.

- [ ] **Step 4: Create `apps/frontend/src/hooks/use-toast.ts`** if not auto-generated

Follow shadcn/ui toast hook documentation. The hook provides `toast({ title, description, variant })` and `useToast()`.

The minimal version:

```ts
// This file is auto-generated by shadcn/ui CLI.
// If missing, run: npx shadcn@latest add toast
export { useToast, toast } from './use-toast-impl';
```

If CLI generated it, skip this step.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/components apps/frontend/src/hooks apps/frontend/components.json
git commit -m "feat(frontend): add shadcn/ui component library"
```

---

### Task 4: API Client & Auth Context

**Files:**

- Create: `apps/frontend/src/lib/api.ts`
- Create: `apps/frontend/src/contexts/AuthContext.tsx`
- Create: `apps/frontend/src/hooks/useAuth.ts`

**Interfaces:**

- Produces:
  - `api` — Axios instance from `src/lib/api.ts`. Usage: `api.get('/staff')`, `api.post('/auth/login', body)`
  - `AuthProvider` — React context provider from `src/contexts/AuthContext.tsx`
  - `useAuth()` — hook returning `{ user, isAuthenticated, login, logout, isLoading }` from `src/hooks/useAuth.ts`

- [ ] **Step 1: Create `apps/frontend/src/lib/api.ts`**

```ts
import axios from 'axios';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from memory store
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor: attach Bearer token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
```

- [ ] **Step 2: Create `apps/frontend/src/contexts/AuthContext.tsx`**

```tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { LoginInput, TokenResponse } from '@cv-generator/shared';

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to refresh to restore session
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await api.post<TokenResponse>('/auth/refresh');
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { data } = await api.post<TokenResponse>('/auth/login', input);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => null);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 3: Create `apps/frontend/src/hooks/useAuth.ts`**

```ts
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/lib/api.ts apps/frontend/src/contexts apps/frontend/src/hooks/useAuth.ts
git commit -m "feat(frontend): add Axios API client with JWT interceptors and auth context"
```

---

### Task 5: App Shell — Router, Layout, Providers

**Files:**

- Create: `apps/frontend/src/components/layout/AppShell.tsx`
- Create: `apps/frontend/src/components/layout/Sidebar.tsx`
- Create: `apps/frontend/src/components/layout/Topbar.tsx`
- Create: `apps/frontend/src/pages/auth/LoginPage.tsx`
- Create: `apps/frontend/src/components/ProtectedRoute.tsx`
- Modify: `apps/frontend/src/main.tsx` (add all providers + router)
- Create: `apps/frontend/src/App.tsx`

**Interfaces:**

- Consumes: `useAuth`, `AuthProvider`, `Button`, `Avatar` from shadcn, all `lucide-react` icons
- Produces: Full app with sidebar navigation, topbar, protected routes, and login page accessible at `http://localhost:5173/login`

- [ ] **Step 1: Create `apps/frontend/src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  LayoutTemplate,
  LogOut,
  BriefcaseBusiness,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/cv', label: 'CV Generator', icon: FileText },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col animate-slide-in-right">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <BriefcaseBusiness className="w-4 h-4 text-accent-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground leading-none">GISCON</p>
          <p className="text-xs text-sidebar-muted leading-none mt-0.5">CV Generator</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-foreground hover:bg-white/10',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            {user?.email[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
            <p className="text-xs text-sidebar-muted capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `apps/frontend/src/components/layout/Topbar.tsx`**

```tsx
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const THEME_KEY = 'theme:v1';

export function Topbar({ title }: { title?: string }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return document.documentElement.classList.contains('dark');
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
    } catch {
      // localStorage unavailable (private mode, quota exceeded)
    }
  }, [dark]);

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-base font-semibold text-foreground">{title ?? 'GISCON CV Generator'}</h1>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDark((d) => !d)}
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </header>
  );
}
```

- [ ] **Step 3: Create `apps/frontend/src/components/layout/AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `apps/frontend/src/pages/auth/LoginPage.tsx`**

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Loader2 } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@cv-generator/shared';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative shadow-modal animate-scale-in">
        <CardHeader className="text-center pb-4">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <BriefcaseBusiness className="w-7 h-7 text-accent-foreground" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to GISCON CV Generator</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@giscon.com"
                autoComplete="email"
                {...register('email')}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-destructive text-xs">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-destructive text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div
                className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Create `apps/frontend/src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin">
          <Loader2 className="w-8 h-8 text-accent" />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 6: Create `apps/frontend/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import LoginPage from '@/pages/auth/LoginPage';

// Lazy page imports (will be created in Plan 4)
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const StaffListPage = lazy(() => import('@/pages/staff/StaffListPage'));
const StaffDetailPage = lazy(() => import('@/pages/staff/StaffDetailPage'));
const StaffFormPage = lazy(() => import('@/pages/staff/StaffFormPage'));
const ProjectListPage = lazy(() => import('@/pages/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('@/pages/projects/ProjectFormPage'));
const CVGeneratorPage = lazy(() => import('@/pages/cv/CVGeneratorPage'));
const CVPreviewPage = lazy(() => import('@/pages/cv/CVPreviewPage'));
const TemplatesPage = lazy(() => import('@/pages/templates/TemplatesPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      retry: 1,
    },
  },
});

// Hoist fallback JSX outside App — static reference, never recreated on App renders
const PAGE_FALLBACK = (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin">
      <Loader2 className="w-8 h-8 text-accent" />
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route
                  path="/"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <DashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/new"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/:id"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/staff/:id/edit"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <StaffFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/new"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/projects/:id/edit"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <ProjectFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/cv"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <CVGeneratorPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/cv/preview/:staffId/:templateId"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <CVPreviewPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/templates"
                  element={
                    <Suspense fallback={PAGE_FALLBACK}>
                      <TemplatesPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Update `apps/frontend/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Create placeholder page stubs for Plan 3 to compile**

Create these minimal stub files so the lazy imports in `App.tsx` don't break (Plan 4 will replace them):

```bash
mkdir -p apps/frontend/src/pages/{dashboard,staff,projects,cv,templates}
```

Create `apps/frontend/src/pages/dashboard/DashboardPage.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="text-foreground">
      <h2 className="text-2xl font-bold">Dashboard</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/staff/StaffListPage.tsx`:

```tsx
export default function StaffListPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Staff</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/staff/StaffDetailPage.tsx`:

```tsx
export default function StaffDetailPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Staff Detail</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/staff/StaffFormPage.tsx`:

```tsx
export default function StaffFormPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Staff Form</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/projects/ProjectListPage.tsx`:

```tsx
export default function ProjectListPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Projects</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/projects/ProjectDetailPage.tsx`:

```tsx
export default function ProjectDetailPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Project Detail</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/projects/ProjectFormPage.tsx`:

```tsx
export default function ProjectFormPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Project Form</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/cv/CVGeneratorPage.tsx`:

```tsx
export default function CVGeneratorPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">CV Generator</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/cv/CVPreviewPage.tsx`:

```tsx
export default function CVPreviewPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">CV Preview</h2>
    </div>
  );
}
```

Create `apps/frontend/src/pages/templates/TemplatesPage.tsx`:

```tsx
export default function TemplatesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground">Templates</h2>
    </div>
  );
}
```

- [ ] **Step 9: Verify app compiles and runs**

```bash
pnpm --filter @cv-generator/frontend dev
```

Visit `http://localhost:5173` — should redirect to `/login`. The login page should render with the GISCON branding and styled form.

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/src
git commit -m "feat(frontend): add app shell, router, auth context, login page, protected routes"
```

---

## Plan 3 Complete ✅

**Deliverable:** A running React frontend with Tailwind v4 design system, shadcn/ui components, JWT auth, sidebar navigation, and protected routing. All page stubs in place for Plan 4 implementation.
