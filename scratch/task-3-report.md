# Task 3 Report: Update Frontend Form (ProjectFormPage.tsx)

## Implemented
- Integrated `useFieldArray` from `react-hook-form` into `ProjectFormPage.tsx` to handle the `participations` array dynamically.
- Implemented `useStaffList` from the custom hook `@/hooks/useStaff` instead of directly using `axios`, following the established project pattern.
- Rendered an inline array of assigned staff, allowing the user to select a staff member (displaying their name and job title), define their role, and write out their responsibilities.
- Enabled adding new participants with a "+ Add Staff" button.
- Enabled removing participants using a `Trash2` icon.
- Handled pre-filling `participations` when in edit mode `isEdit = true`.

## Tested
- Executed `pnpm --filter frontend type-check` to verify that the frontend builds and type-checks successfully after the changes.
- Results: PASS (TypeScript compiled with `--noEmit` without errors).

## Files Changed
- `apps/frontend/src/pages/projects/ProjectFormPage.tsx`

## Self-Review Findings
- The UI properly leverages `shadcn/ui` where applicable, along with basic inputs and selects styled consistently using standard tailwind tokens (no arbitrary values).
- The use of custom hooks instead of raw `axios` calls aligns with the project's codebase structure, keeping logic clean and modular.
- Zod schema types correctly bind to the `react-hook-form`.

## Concerns or Issues
- No concerns. The task was completed precisely as requested.

## Fixes Implemented
- Added `Textarea` component via `shadcn/ui`.
- Replaced the native HTML `<select>` with the `shadcn/ui` `Select` component in `ProjectFormPage.tsx`, wrapping it correctly with `react-hook-form`'s `Controller`.
- Replaced the native HTML `<textarea>` with the `shadcn/ui` `Textarea` component for the responsibilities field and the description field.
- Verified that `pnpm --filter frontend type-check` passes successfully.

## Files Changed
- `apps/frontend/src/pages/projects/ProjectFormPage.tsx`
- `apps/frontend/src/components/ui/textarea.tsx` (Added)
