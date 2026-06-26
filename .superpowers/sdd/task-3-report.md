# Task 3 Report: Backend Controller & Router Updates

## What was implemented
Added `resetPassword` method to `StaffController` in `staff.controller.ts` which extracts the `password` from the request body, checks for its presence, calls `StaffService.resetPassword`, and returns a success response.
Added the corresponding `POST /:id/reset-password` endpoint in `staff.router.ts`, guarded by `requireAuth` and `requireAdmin` middlewares.

## What was tested and test results
Built the backend using `npm run build` which passed successfully.
Ran the backend tests suite using `npm run test` which also passed successfully (58 passed, 58 total).

## Files changed
- `apps/backend/src/staff/staff.controller.ts`
- `apps/backend/src/staff/staff.router.ts`

## Self-review findings
Implementation accurately matches the task brief, properly utilizing existing error handler (`AppError`) and following the `asyncHandler` pattern for router. Reused authentication middlewares in line with other modifying routes for staff records.

## Any issues or concerns
None.

### Review Fixes
Added unit tests for `resetPassword` in `staff.controller.test.ts`.
Added integration-style test for `POST /staff/:id/reset-password` in `staff.router.test.ts` to test authorization logic using native `fetch` on a dynamically bound server.
Ran the full backend test suite successfully (63/63 passing).
