# Task 5 Report: TemplateWizardPage — Step 4 + Orchestrator

## What Implemented
- Created `apps/frontend/src/pages/templates/wizard/Step4Preview.tsx` as the final step of the template builder wizard, which includes:
  - Dynamic loading of `@react-pdf/renderer` and lazy loading of the `<CVDocument>` component.
  - Integration with the `useStaffList` hook and fallback dummy preview data when no staff member exists or the dummy API preview request fails.
  - Rendered PDF preview wrapper with dynamic styling.
- Created `apps/frontend/src/pages/templates/TemplateWizardPage.tsx` as the main orchestrator for the 4-step wizard, which includes:
  - Form validation on steps 1 and 2 (`canAdvance` logic).
  - Clean styling, progress bars, and navigation controls.
  - Multi-step state management (`draftConfig` state sharing).
  - Integration with React Query mutations for template creation and update, as well as template detail queries.
- Cleaned up typescript errors in `apps/frontend/src/pages/templates/wizard/Step2Sections.tsx` and `apps/frontend/src/pages/templates/TemplateWizardPage.tsx` to enable successful building.
- Cleaned up tracked deleted files from the legacy typo directory `@/components`.

## Verification Details
- Built and type-checked the frontend application successfully:
  - Command: `pnpm --filter @cv-generator/frontend build`
  - Result: Exit status 0, compilation succeeded, production assets generated.

## Files Changed
- Created: `apps/frontend/src/pages/templates/wizard/Step4Preview.tsx`
- Created: `apps/frontend/src/pages/templates/TemplateWizardPage.tsx`
- Modified: `apps/frontend/src/pages/templates/wizard/Step2Sections.tsx` (fixed TS compiler errors)
- Staged/committed switch component dependency changes:
  - Modified: `apps/frontend/package.json`
  - Created: `apps/frontend/src/components/ui/switch.tsx`
  - Modified: `pnpm-lock.yaml`
- Cleaned up deleted typo files:
  - Deleted: `apps/frontend/@/components/ui/alert-dialog.tsx`
  - Deleted: `apps/frontend/@/components/ui/button.tsx`

## Self-Review Findings
- All components use standard Tailwind CSS classes matching the design system (`shadow-card`, `text-accent`, etc.).
- Robust validation in the wizard handles user edge cases (such as blocking progression if there's no name or if the header section is invisible).
- Properly handled React PDF's heavy runtime weight by lazy-loading it and displaying an overlay loading indicator.

## Issues/Concerns
- None.

## Fixes (Role Gating, State Sync, Accessibility)
- Added role gating to `TemplateWizardPage.tsx`: retrieves current `user` from `useAuth` and redirects non-admin users to `/templates` with an "Access denied" toast notification.
- Fixed rendering sync bug by moving state synchronization from render logic to `useEffect` trigger on `existingTemplate` query load.
- Replaced standard browser `alert()` with `useToast` notifications on save failure.
- Updated main header to `<h1>` with `id="wizard-title"`.
- Added unique action button IDs: `id="cancel-btn"`, `id="back-btn"`, `id="next-btn"`, and `id="save-btn"`.
