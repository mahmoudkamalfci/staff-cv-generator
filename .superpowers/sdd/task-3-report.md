# Task 3 Report: Staff Pages (List, Detail, Form)

## What Was Implemented

1. **`SkillBadge` Component**
   - Displays a staff member's skill name and level (`beginner`, `intermediate`, `advanced`, or `expert`).
   - Uses color-coded backgrounds based on skill levels.
   - Provides an optional delete button using the `X` icon from `lucide-react`, guarded by role permissions (`canDelete` & `onDelete` props).

2. **`SkillsManager` Component**
   - Renders a list of the staff member's current skills.
   - Provides an inline form for admin users to add a new skill with validation via React Hook Form and Zod (`CreateSkillSchema`).
   - Uses `@tanstack/react-query` mutations (`useAddSkill` and `useDeleteSkill`) to perform mutations and triggers success toasts.

3. **`StaffListPage` Page Component**
   - Lists all staff members in the system with full searching capability (by name or job title).
   - Shows skeleton cards while loading the data.
   - Limits administrative operations (Add Staff, Edit, Delete) to the admin role.
   - Fully resolved nesting validation errors by applying the `asChild` prop on any Shadcn `Button` wrapping a React Router `Link` component.

4. **`StaffDetailPage` Page Component**
   - Displays a structured profile including years of experience, professional summary, and list of skills.
   - Integrates the `SkillsManager` component.
   - Includes a section to choose a CV template and navigate to the CV preview page.
   - Uses the `asChild` pattern for React Router links.

5. **`StaffFormPage` Page Component**
   - Handles both the creation of new staff profiles and editing of existing ones.
   - Utilizes React Hook Form and Zod schema validation (`CreateStaffSchema`) to display validation error messages.
   - Replaced `defaultValues` with the `values` option in React Hook Form to fix a state caching bug where fields remained empty when data fetched asynchronously after the initial mount.
   - Integrates file upload functionality using the `useUploadStaffPhoto` mutation hook.

---

## Verification Details

- **Compilation & Bundling**: Successfully built the application without any typecheck errors.
  - Command: `pnpm --filter @cv-generator/frontend build`
  - Output: Successfully generated build artifacts in the `dist` folder.
- **ESLint & Quality Check**: ESLint was run on the workspace. No errors or warnings were introduced by the newly added or modified staff-related components/pages.

---

## Files Changed

- **Created**:
  - `apps/frontend/src/components/staff/SkillBadge.tsx`
  - `apps/frontend/src/components/staff/SkillsManager.tsx`
- **Modified**:
  - `apps/frontend/src/pages/staff/StaffListPage.tsx`
  - `apps/frontend/src/pages/staff/StaffDetailPage.tsx`
  - `apps/frontend/src/pages/staff/StaffFormPage.tsx`

---

## Self-Review Findings

- **Accessibility**: Applied semantic headings and `aria-label` for buttons.
- **Error/State Handling**: Incorporated loading spinners and error state fallbacks (like rendering "Staff member not found").
- **HTML Nesting Rules**: Ensured no native interactive tags are nested within other interactive tags by using `<Button asChild>` for links.
- **Hook Bugfix**: Discovered and resolved a hook caching bug in `StaffFormPage.tsx`. Since data loading was conditional, using `defaultValues` was causing fields to render empty during edits once data was loaded. Using the React Hook Form `values` property correctly keeps inputs in sync with the fetched async data.

---

## Fixes Implemented (Role Gating, Validation Display, and Accessibility)

1. **Role Gating on StaffFormPage:**
   - Enforced admin-only access using `useAuth()` and a `useEffect` hook.
   - Unauthorized attempts show an 'Access denied' toast and redirect using `navigate('/staff', { replace: true })`.
   - Returns `null` if the user is not authenticated or not an admin.

2. **Photo Preview in StaffFormPage:**
   - Rendered a styled thumbnail preview (`w-24 h-24 rounded-full overflow-hidden bg-muted border border-border mb-4`) above the photo upload button if `existing?.photoUrl` is set.

3. **SkillsManager Level Error & Accessibility:**
   - Rendered the select field validation error message for `level`.
   - Associated the level `<Label>` and the `<SelectTrigger>` by setting `htmlFor="skill-level"` and `id="skill-level"`.
   - Enabled immediate validation on Level selection changes by passing `{ shouldValidate: true }` to `setValue`.
   - Wrapped `addSkill.mutateAsync` and `deleteSkill.mutateAsync` calls in `try/catch` blocks to capture promise rejections and show appropriate toasts.

4. **StaffDetailPage Template Select Accessibility:**
   - Imported and added `<Label htmlFor="template-select" className="text-xs">Template</Label>` above the template Select.
   - Associated it by setting `id="template-select"` on the `<SelectTrigger>`.
