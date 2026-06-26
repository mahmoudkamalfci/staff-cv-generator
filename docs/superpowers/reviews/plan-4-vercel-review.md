# Plan 4 Review: Vercel React Best Practices

> **Reviewer:** Senior Frontend Architect (automated review)
> **Date:** 2026-06-25
> **Plan:** `docs/superpowers/plans/2026-06-25-plan-4-frontend-features.md`
> **Stack:** Vite 5 + React 18 + React Router v6 + TanStack React Query v5
> **Scope:** Vite-specific; Next.js-only rules (RSC, Server Actions, `next/dynamic`) are skipped.

---

## Executive Summary

The plan is well-structured and follows solid React patterns in many areas (query key factories, invalidation strategies, skeleton loading, useRef for DOM access). However, it has **three critical bundle-size issues** that will meaningfully hurt Time-to-Interactive: all three CV template components are statically imported into the CV Preview page, `lucide-react` barrel imports appear everywhere, and `@react-pdf/renderer` (if added in future) would need lazy-loading. There is also a significant **waterfall on the Dashboard page** (three sequential query hooks where one is blocked by the others' stale state on cold load), and the **CV Preview page is missing a Suspense boundary** that would allow the print toolbar to render while data loads. Fixing these five points before implementation begins will have the highest return on investment.

---

## Critical Issues (Must Fix Before Implementation)

### 1. `bundle-barrel-imports` — Lucide barrel imports throughout every page

**Severity:** CRITICAL (200–800 ms import cost per page in dev; measurable in prod)

**Where in plan:**
Every single page imports directly from `lucide-react` as a barrel:

```tsx
// Task 2, StaffListPage, ProjectListPage, CVGeneratorPage, CVPreviewPage, etc.
import { Users, FolderKanban, LayoutTemplate, FileText } from 'lucide-react';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
```

`lucide-react` has 1,583+ modules in its barrel entry. In a non-Next.js Vite app, `optimizePackageImports` is not applied automatically.

**Rule:** `bundle-barrel-imports`

**Recommended fix:**
Two acceptable approaches (pick one and apply consistently):

**Option A — Vite `optimizeDeps` (recommended, zero code change):**
Add to `vite.config.ts`:

```ts
optimizeDeps: {
  include: ['lucide-react'],
}
```

Vite will pre-bundle and deduplicate lucide on first dev start. This is the Vite equivalent of Next.js `optimizePackageImports`.

**Option B — Direct subpath imports (code change):**

```tsx
// Replace barrel imports with direct paths
import Users from 'lucide-react/dist/esm/icons/users';
import FolderKanban from 'lucide-react/dist/esm/icons/folder-kanban';
```

> ⚠️ Lucide does not ship `.d.ts` for subpaths in older versions — verify TypeScript types before using.

**Action:** Add this to the plan as a prerequisite step (ideally in Task 1 or a new "Task 0: Vite configuration").

---

### 2. `bundle-dynamic-imports` — All CV template components statically imported in CVPreviewPage

**Severity:** CRITICAL (directly impacts TTI and LCP of the CV preview route)

**Where in plan (Task 6, Step 4 — `CVPreviewPage.tsx`):**

```tsx
// All three templates bundled into the main preview chunk
import { ClassicTemplate } from '@/components/cv-templates/ClassicTemplate';
import { ModernTemplate } from '@/components/cv-templates/ModernTemplate';
import { CompactTemplate } from '@/components/cv-templates/CompactTemplate';
```

The CV Preview page is the heaviest page in the entire app. Statically importing all three template components means the user downloads code for `ModernTemplate` and `CompactTemplate` even when they requested `ClassicTemplate`. Each template also inline-imports `formatDate` helpers and may grow to include chart/SVG rendering.

**Rule:** `bundle-dynamic-imports`

**Recommended fix:**
Use Vite's native `React.lazy` + `import()` with a statically analyzable map (also satisfies `bundle-analyzable-paths`):

```tsx
import { lazy, Suspense } from 'react';
import type { LayoutKey } from '@cv-generator/shared';

// Each string literal is statically analyzable by Vite's bundler
const templateComponents = {
  classic: lazy(() =>
    import('@/components/cv-templates/ClassicTemplate').then((m) => ({
      default: m.ClassicTemplate,
    })),
  ),
  modern: lazy(() =>
    import('@/components/cv-templates/ModernTemplate').then((m) => ({ default: m.ModernTemplate })),
  ),
  compact: lazy(() =>
    import('@/components/cv-templates/CompactTemplate').then((m) => ({
      default: m.CompactTemplate,
    })),
  ),
} satisfies Record<LayoutKey, ReturnType<typeof lazy>>;

// In render:
const TemplateComponent = templateComponents[data.template.layoutKey as LayoutKey];

return (
  <Suspense
    fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }
  >
    <TemplateComponent data={data} />
  </Suspense>
);
```

This reduces the initial CV preview chunk size from ~3 templates to ~1, and the other templates load only if ever needed.

---

### 3. `bundle-dynamic-imports` / `bundle-conditional` — No lazy-loading strategy for `@react-pdf/renderer` (if used)

**Severity:** CRITICAL (pre-emptive — plan currently uses browser `window.print()`, but the README mentions Puppeteer v2)

**Where in plan:** The plan's README mentions `@react-pdf/renderer` as a planned v2 addition. The current plan uses `window.print()` which is correct and lightweight. However, if anyone adds `@react-pdf/renderer` as a static import during implementation (a common temptation), it adds ~500 KB+ to the bundle.

**Rule:** `bundle-conditional`, `bundle-dynamic-imports`

**Recommended fix:** Add an explicit note to the plan:

> ⚠️ **IMPORTANT:** Do NOT import `@react-pdf/renderer` statically. If added in future, it MUST be loaded via `React.lazy` + `import()` gated behind a user action (e.g., clicking "Download PDF"). The package is ~500KB and must never land in the initial bundle.

---

## Important Issues (Should Fix)

### 4. `async-parallel` / `async-suspense-boundaries` — Dashboard fires 3 sequential React Query hooks with no parallelism guarantee

**Severity:** HIGH

**Where in plan (Task 2 — `DashboardPage.tsx`):**

```tsx
const { data: staff, isLoading: staffLoading } = useStaffList();
const { data: projects, isLoading: projectsLoading } = useProjectList();
const { data: templates, isLoading: templatesLoading } = useTemplateList();
```

React Query does parallelize these hooks when they are all enabled at mount time — so this is **not a waterfall in the traditional sense**. However, React Query's `useQuery` hooks each render independently. The issue arises when React Query's `gcTime` expires and the cache is cold: the three loading states are managed separately with no structural relationship, causing the UI to show three independent Skeleton flashes rather than a single coherent loading state.

More critically: **`useStaffDetail` in `StaffFormPage` is called unconditionally** even in create mode (when `id` is `''`):

```tsx
// Task 3, Step 5 — StaffFormPage.tsx
const { data: existing, isLoading } = useStaffDetail(id ?? '');
```

Although `enabled: !!id` is set in the hook, `useStaffDetail('')` still evaluates `enabled: !!''` → `false`, which is correct. However, `useUpdateStaff(id ?? '')` and `useUploadStaffPhoto(id ?? '')` **are called unconditionally with `''`** and will be bound to an empty-string ID. This is a logic smell but not a runtime error given mutation functions are not auto-triggered.

**Rule:** `async-parallel`, `async-suspense-boundaries` (client-side equivalent)

**Recommended fix for Dashboard:**
Consider wrapping stat cards in a single `Suspense` boundary (React Query supports suspense mode via `useSuspenseQuery`):

```tsx
// In DashboardPage — use useSuspenseQuery for cleaner loading boundary
import { useSuspenseQuery } from '@tanstack/react-query';

// Wrap the stat grid in <Suspense fallback={<StatsGridSkeleton />}>
// This gives one clean loading state instead of three independent spinners
```

Or, at minimum, introduce a single combined `isLoading` boolean:

```tsx
const isLoading = staffLoading || projectsLoading || templatesLoading;
```

**Fix for StaffFormPage — guard mutation hooks:**
Add plan note: all three mutation hooks that accept `id` should guard against the empty-string case with a conditional check in the `mutationFn`, not just relying on the caller to not call `mutateAsync`.

---

### 5. `async-suspense-boundaries` — CVPreviewPage blocks the entire page on data load

**Severity:** HIGH

**Where in plan (Task 6, Step 4 — `CVPreviewPage.tsx`):**

```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
    </div>
  );
}
```

The entire page — including the Print Toolbar — is withheld until data arrives. The toolbar is static and can render immediately.

**Rule:** `async-suspense-boundaries` (client-side equivalent)

**Recommended fix:**
Separate the static toolbar from the data-dependent CV content:

```tsx
export default function CVPreviewPage() {
  const { staffId, templateId } = useParams<{ staffId: string; templateId: string }>();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar renders IMMEDIATELY — no data needed */}
      <div className="no-print sticky top-0 z-20 bg-white border-b px-6 py-3 ...">
        <Link to="/cv">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <Button onClick={() => window.print()} variant="accent" size="sm">
          Print / Save PDF
        </Button>
      </div>

      {/* CV content streams in separately */}
      <div className="py-8 px-4 flex justify-center">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin mt-20" />}>
          <CVContent staffId={staffId!} templateId={templateId!} />
        </Suspense>
      </div>
    </div>
  );
}

// Separate component — data fetching isolated here
function CVContent({ staffId, templateId }: { staffId: string; templateId: string }) {
  const { data, error } = useSuspenseQuery({
    queryKey: ['cv', staffId, templateId],
    queryFn: () => api.get<CVData>(`/cv/${staffId}/${templateId}`).then((r) => r.data),
  });
  // ... render template
}
```

This also pairs naturally with the lazy template fix from Issue #2.

---

### 6. `rerender-no-inline-components` — `StatCard` defined inside `DashboardPage` module but outside the component (OK) — verify pattern holds for all pages

**Severity:** MEDIUM-HIGH

**Where in plan:** `StatCard` in `DashboardPage.tsx` is defined at module scope before `DashboardPage` — this is **correctly** done and gets a ✅.

**HOWEVER**, there is a subtle inline-component risk in multiple list pages. The pattern:

```tsx
// StaffListPage — skeleton cards
Array.from({ length: 6 }).map((_, i) => (
  <Card key={i} className="shadow-card">
    <CardContent className="p-5 space-y-3">...
```

is JSX returned inline (not a component definition), which is fine. ✅

The **real risk** is in `ProjectFormPage.tsx` where tech tag management uses inline render functions. Confirm during implementation that no `const MyComponent = () => ...` definitions appear inside other components' function bodies.

**Rule:** `rerender-no-inline-components`

**Recommended action:** Add a plan note/lint rule: "Never define a component with `const X = () =>` or `function X()` inside another component's function body."

---

### 7. `rerender-derived-state-no-effect` — `useEffect` to reset form is an anti-pattern

**Severity:** MEDIUM-HIGH

**Where in plan (Task 3, Step 5 — `StaffFormPage.tsx` and Task 4, Step 2 — `ProjectFormPage.tsx`):**

```tsx
useEffect(() => {
  if (existing) {
    reset({ name: existing.name, jobTitle: existing.jobTitle, ... });
  }
}, [existing, reset]);
```

This is the classic "sync external data into form via effect" pattern that React's documentation warns against. It causes an extra render cycle (mount → effect fires → reset → re-render). React Hook Form's `reset` triggered in an effect also has edge cases with concurrent features.

**Rule:** `rerender-derived-state-no-effect`

**Recommended fix:**
Use RHF's `defaultValues` with React Query's `data` directly via the `useQuery` result, and use `key` prop to remount the form when data changes:

```tsx
// Preferred: use RHF's defaultValues + key to remount
const { data: existing } = useStaffDetail(id ?? '');

const form = useForm<CreateStaffInput>({
  resolver: zodResolver(CreateStaffSchema),
  defaultValues: existing
    ? { name: existing.name, jobTitle: existing.jobTitle, ... }
    : undefined,
});

// Alternative: keep the effect but use `key` on the form component
// <StaffFormInner key={existing?.id} existing={existing} />
```

If the `useEffect` pattern must be kept, add `reset` to the stable closure using the ref pattern (RHF's `reset` is already stable, so the effect is not wrong per se, just suboptimal).

---

## Minor Issues (Nice to Have)

### 8. `rerender-functional-setstate` — Non-functional setState in `ProjectFormPage`

**Where in plan (Task 4, Step 2 — `ProjectFormPage.tsx`):**

```tsx
const addTech = () => {
  const t = techInput.trim();
  if (t && !technologies.includes(t)) setTechnologies((prev) => [...prev, t]); // ✅ functional
  setTechInput('');
};

const removeTech = (tech: string) => setTechnologies((prev) => prev.filter((t) => t !== tech)); // ✅ functional
```

Both are already using functional setState — ✅ **correctly applied**.

The `setTechInput('')` call is a static value reset, not dependent on previous state — also ✅ correct.

---

### 9. `rerender-use-deferred-value` — Search filtering on large lists could lag

**Where in plan (Task 3, Step 3 — `StaffListPage.tsx` and Task 4, Step 1 — `ProjectListPage.tsx`):**

```tsx
const filtered = staff?.filter(
  (s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.jobTitle.toLowerCase().includes(search.toLowerCase()),
);
```

For small datasets (< 100 items) this is fine. For larger datasets, the filter runs synchronously on every keystroke, blocking the input.

**Rule:** `rerender-use-deferred-value`

**Recommended fix (if needed):**

```tsx
const deferredSearch = useDeferredValue(search);
const filtered = useMemo(
  () =>
    staff?.filter(
      (s) =>
        s.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
        s.jobTitle.toLowerCase().includes(deferredSearch.toLowerCase()),
    ),
  [staff, deferredSearch],
);
const isStale = search !== deferredSearch;
// Optionally apply opacity to filtered list when isStale
```

Given this is an internal tool with likely < 200 staff, this is LOW priority. Add as a future optimization note.

---

### 10. `rerender-split-combined-hooks` — `StaffDetailPage` calls `useStaffDetail` and `useTemplateList` independently (OK)

**Where in plan (Task 3, Step 4 — `StaffDetailPage.tsx`):**

```tsx
const { data: staff, isLoading } = useStaffDetail(id!);
const { data: templates } = useTemplateList();
```

Both are independent queries with no shared state — ✅ correctly parallelized.

---

### 11. `js-combine-iterations` — `ProjectListPage` casts `technologies` twice per card

**Where in plan (Task 4, Step 1 — `ProjectListPage.tsx`):**

```tsx
{(project.technologies as string[]).slice(0, 6).map((tech) => ...)}
{(project.technologies as string[]).length > 6 && ...}
```

`project.technologies as string[]` is cast twice. Minor: extract to a variable.

**Rule:** `js-combine-iterations`

**Recommended fix:**

```tsx
const techs = project.technologies as string[];
// Then use techs.slice(0, 6) and techs.length
```

---

### 12. `rendering-animate-svg-wrapper` — `Loader2` animated directly on SVG

**Where in plan:** Multiple pages use:

```tsx
<Loader2 className="w-8 h-8 animate-spin text-accent" />
```

`Loader2` from lucide-react is an SVG element. `animate-spin` is applied directly to the SVG (via Tailwind's `transform: rotate`), which some browsers don't hardware-accelerate on SVG.

**Rule:** `rendering-animate-svg-wrapper`

**Recommended fix:**

```tsx
<div className="animate-spin">
  <Loader2 className="w-8 h-8 text-accent" />
</div>
```

This is LOW priority since `animate-spin` uses `transform` which modern browsers handle fine on SVG in most cases. Worth standardizing but not blocking.

---

### 13. `rendering-conditional-render` — `&&` short-circuit with falsy numbers

**Where in plan (Task 2 — `DashboardPage.tsx`):**

```tsx
<p className="text-3xl font-bold">{value ?? 0}</p>
```

This specific usage correctly uses `?? 0` to handle `undefined`, so `value` is always a number before render — ✅.

However, in `ProjectListPage` and `StaffListPage`:

```tsx
{(project.technologies as string[]).length > 6 && (
  <span>+{...} more</span>
)}
```

This is a boolean (not a number) guard — ✅ correctly applied.

No violations found.

---

### 14. `client-localstorage-schema` — No localStorage usage in plan

The plan has no direct `localStorage` reads or writes. Auth tokens are stored in memory per the README. ✅ No violation.

---

## Good Patterns (Correctly Applied)

These patterns follow best practices and should be preserved:

1. **Query key factory pattern** — `staffKeys`, `projectKeys` with structured factory functions (`staffKeys.all`, `staffKeys.detail(id)`) are correct, scalable, and enable precise invalidation. ✅ `client-swr-dedup` equivalent — React Query used consistently instead of raw `useEffect` fetches.

2. **Targeted cache invalidation** — `useUpdateStaff` invalidates both `staffKeys.all` AND `staffKeys.detail(id)`. `useCreateParticipation` invalidates both the project and the staff participations sub-key. This is precise and avoids over-broad invalidation. ✅

3. **`enabled` guard on conditional queries** — `useStaffDetail(id)` uses `enabled: !!id` and `useCVData` uses `enabled: !!staffId && !!templateId`. ✅ Prevents spurious requests on mount.

4. **`staleTime: 0` rationale documented** — `useCVData` explicitly comments why `staleTime: 0` is intentional (backend audit log). ✅ Good self-documenting code.

5. **`StatCard` defined at module scope** — `StatCard` in `DashboardPage` is declared outside the parent component function. ✅ Avoids `rerender-no-inline-components` violation.

6. **`useRef` for file input** — `StaffFormPage` uses `useRef<HTMLInputElement>` for the hidden file input instead of uncontrolled DOM manipulation. ✅

7. **Functional setState in `addTech`/`removeTech`** — Both tech tag mutation handlers use `setTechnologies(prev => ...)` functional form. ✅ `rerender-functional-setstate`.

8. **Template dispatch via record map** — `CVPreviewPage`'s `templateComponents` record map avoids dynamic string interpolation in `import()` paths, satisfying `bundle-analyzable-paths` for the static imports (though they still need to become lazy — see Issue #2).

9. **Skeleton loading states** — All list pages render skeleton placeholders during loading instead of blank screens. ✅ Good perceived performance pattern.

10. **Admin role-gating at render time** — `user?.role === 'admin'` gates create/edit/delete UI elements. ✅ Consistent with the Global Constraints specification.

11. **`noValidate` on forms** — All `<form>` elements use `noValidate` to suppress browser native validation in favor of RHF + Zod. ✅

12. **`useDeleteParticipation` broadens invalidation appropriately** — Invalidating `projectKeys.all` (not just the specific project) is acceptable since participations affect project counts shown in the list. Minor over-invalidation but predictably safe.

---

## Recommended Plan Updates

The following concrete changes should be made to the plan before implementation begins, ordered by priority:

### P0 — Must Do Before Writing Any Code

**[A] Add "Task 0: Configure Vite for bundle optimization"** (new task, insert before Task 1):

- Add `optimizeDeps.include: ['lucide-react']` to `vite.config.ts`
- Add `build.rollupOptions.output.manualChunks` to split CV templates into their own chunk
- Consider adding `vite-bundle-visualizer` as a dev dependency for bundle analysis

**[B] Update Task 6, Step 4 — `CVPreviewPage.tsx`:**

- Convert all three `cv-template` imports to `React.lazy(() => import(...))` with statically analyzable paths
- Wrap the template render in `<Suspense>` as shown in Issue #2
- Restructure the page to render the Print Toolbar unconditionally (Issue #5)

### P1 — Should Do Before Implementation

**[C] Update Task 2 — `DashboardPage.tsx`:**

- Add combined `isLoading` boolean for a single skeleton state
- OR migrate to `useSuspenseQuery` with a wrapping `<Suspense>` boundary

**[D] Update Task 3, Step 5 & Task 4, Step 2 — `StaffFormPage.tsx` and `ProjectFormPage.tsx`:**

- Replace `useEffect` + `reset()` pattern with `defaultValues` initialized from query data
- Use `key={existing?.id}` on the form card to reset automatically when data changes

**[E] Update Task 6, Step 4 — `CVPreviewPage.tsx`:**

- Split into `CVPreviewPage` (shell + toolbar) and `CVContent` (data + template render)
- Use `useSuspenseQuery` in `CVContent` so the Suspense boundary works cleanly

### P2 — Nice to Have / Future

**[F] Add implementation note to Global Constraints:**

> "Never `import @react-pdf/renderer` statically. Any PDF library must be loaded via `React.lazy` gated by user action."

**[G] Add Vite bundle size check to CI** (outside plan scope but worth noting):

> Consider adding `vite-plugin-bundle-size-limit` or checking output in the `turbo build` pipeline to catch large static imports.

**[H] Add `useDeferredValue` note to search in `StaffListPage` and `ProjectListPage`:**

> "If staff list grows beyond 200 items, wrap filter in `useDeferredValue` + `useMemo`."

**[I] Tech tags in `ProjectListPage` and `ProjectDetailPage`:**

> Extract `project.technologies as string[]` to a local variable before rendering to avoid double type-casts.

---

## Summary Score by Category

| Category                     | Severity    | Status        | Key Issues                                                            |
| ---------------------------- | ----------- | ------------- | --------------------------------------------------------------------- |
| 1. Eliminating Waterfalls    | CRITICAL    | ⚠️ Partial    | Dashboard layout could use Suspense; CVPreview blocks toolbar         |
| 2. Bundle Size Optimization  | CRITICAL    | ❌ Needs Work | Lucide barrel imports; CV templates all statically imported           |
| 3. Server-Side Performance   | HIGH        | ✅ N/A        | Vite/CSR app — no SSR concerns                                        |
| 4. Client-Side Data Fetching | MEDIUM-HIGH | ✅ Good       | React Query used correctly with dedup and caching                     |
| 5. Re-render Optimization    | MEDIUM      | ⚠️ Minor      | `useEffect`+`reset` anti-pattern; search could use `useDeferredValue` |
| 6. Rendering Performance     | MEDIUM      | ⚠️ Minor      | `Loader2` animated directly on SVG; otherwise clean                   |
| 7. JavaScript Performance    | LOW-MEDIUM  | ✅ Good       | Functional setState used; minor tech-tag double-cast                  |
| 8. Advanced Patterns         | LOW         | ✅ Good       | No violations found                                                   |

**Overall verdict:** The data-layer architecture is solid. The primary risk is bundle size on the CV preview route. Fix Issues #1 and #2 before implementation begins — they require plan changes, not just code review.
