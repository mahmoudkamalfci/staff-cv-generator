# Staff Profile & Projects Permissions Design

## Overview
This design outlines the approach to allow staff members to edit their own profiles and restrict their project view to only the projects they are assigned to.

## Scope
* **Staff Profile**: Staff members can view all profiles but can only edit their own profile. Admins can edit any profile.
* **Projects**: Staff members can only view projects they are assigned to (where they have a `Participation` record). They cannot edit, create, or delete projects. Admins can view and manage all projects.

## Architecture

### 1. Backend Security & Logic (Role-Aware Endpoints)
Instead of relying strictly on middleware to block staff, the backend endpoints will be context-aware based on the requester's role.

#### Profile Editing (`/api/staff/:id`)
* **Endpoint**: `PATCH /api/staff/:id`
* **Current State**: Uses `requireAdmin` middleware.
* **Proposed Changes**:
  * Remove `requireAdmin` from this specific route.
  * In `StaffController.updateStaff`, fetch the `Staff` record being updated.
  * Implement authorization logic: `if (req.user.role !== 'admin' && staff.userId !== req.user.userId) { throw Forbidden }`.

#### Project Filtering (`GET /api/projects`)
* **Endpoint**: `GET /api/projects`
* **Current State**: Returns all projects, unprotected by role.
* **Proposed Changes**:
  * Keep it accessible to all authenticated users.
  * In `ProjectsController.getProjects`, check the user's role.
  * If `req.user.role === 'staff'`, lookup the `Staff` record for `req.user.userId`.
  * Pass the resolved `staffId` to `ProjectsService.getProjects(page, limit, search, staffId)`.
  * The `ProjectsService` will add a prisma filter: `where: { participations: { some: { staffId } } }`.

#### Project Management (`POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`)
* **Current State**: Uses `requireAdmin` middleware.
* **Proposed Changes**: None. Staff will continue to receive `403 Forbidden` for these actions.

### 2. Frontend UI Adjustments
The UI needs to reflect these backend permissions to provide a seamless user experience.

#### Staff Profiles
* **Current State**: "Edit" buttons might be visible to all, or only admins.
* **Proposed Changes**: Conditionally render the "Edit" and "Delete" buttons. A staff member should only see the "Edit" button if viewing their own profile page. The "Delete" button should remain admin-only.

#### Projects Page
* **Current State**: Shows all projects with management buttons.
* **Proposed Changes**: 
  * The list will inherently only show assigned projects due to the backend changes.
  * Hide "New Project", "Edit", and "Delete" actions/buttons if the logged-in user is `staff`.

## Security Considerations
* **Direct API Access**: Malicious users cannot bypass UI restrictions because the backend controllers independently verify the `userId` against the target resource.
* **Data Leakage**: The `GET /api/projects` endpoint securely filters data at the database level for staff members, ensuring unassigned projects are never transmitted to the client.

## Open Questions & Ambiguities
* None at this time. All fields are editable by staff for their own profile, and project access is strictly read-only for assigned projects.
