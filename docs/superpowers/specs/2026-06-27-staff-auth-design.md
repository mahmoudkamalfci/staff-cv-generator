# Staff Authentication & Password Management Design

## Overview
This feature introduces authentication credentials (email and password) to the staff member creation process. It allows administrators to set an initial password when creating a new staff member and provides a mechanism to reset a staff member's password when editing their profile.

## Architecture & Data Flow

### Backend Changes
1. **Schema Validation (`packages/shared/src/schemas/staff.ts`)**:
   - Update `CreateStaffSchema` to include required `email` (string, email format) and `password` (string, min 8 chars).
   - Create a `ResetPasswordSchema` for the new reset password endpoint.

2. **API Routes (`apps/backend/src/staff/staff.router.ts`)**:
   - Add a new `POST /:id/reset-password` endpoint.

3. **Controllers & Services (`staff.controller.ts`, `staff.service.ts`)**:
   - Modify `createStaff`: Hash the provided password and create a `User` record (role: 'staff') transactionally with the `Staff` record. Link them via `userId`.
   - Add `resetPassword`: Accept the staff ID and new password. Look up the associated `User` record via `Staff.userId`, hash the new password, and update the `User` record.
   - Modify `updateStaff`: If `email` is provided, update the associated `User` record's email.

### Frontend Changes
1. **API Hooks (`apps/frontend/src/hooks/useStaff.ts`)**:
   - Add a `useResetPassword` mutation hook to call the new `reset-password` endpoint.

2. **Staff Form UI (`apps/frontend/src/pages/staff/StaffFormPage.tsx`)**:
   - **Create Mode**: Add `Email` and `Password` input fields to the main form.
   - **Edit Mode**: Add the `Email` field to allow email updates. Do not show the password field directly in the form.
   - **Reset Password Dialog**: In edit mode, add a "Reset Password" button. When clicked, it opens a dialog component (using shadcn/ui) containing a "New Password" input and a save button.

## Error Handling
- **Duplicate Email**: If the admin tries to create a staff member with an email that already exists in the `User` table, the backend should return a 409 Conflict error, and the frontend should display a user-friendly error message.
- **Validation**: Frontend form validation using Zod will ensure valid email formats and minimum password lengths before submission.

## Security Considerations
- Passwords will be hashed (e.g., using bcrypt) before being stored in the database.
- The reset password endpoint must ensure the user performing the action is an admin (which should already be handled by the router's auth middleware).
