# Add Skills and Previous Projects to Staff Form

## 1. Goal
Enhance the "Add/Edit Staff" form to allow administrators to attach **Skills** and **Previous Projects** (Participations) directly when creating or updating a staff member.

## 2. Approach

We will use an **Inline Dynamic Array** approach on the frontend (using React Hook Form's `useFieldArray`), keeping everything in a single, cohesive form.

### 2.1 Backend Changes
- **Schemas (`packages/shared/src/schemas/staff.ts`)**: 
  Update `CreateStaffSchema` and `UpdateStaffSchema` to accept two new arrays:
  - `skills`: Array of objects containing `name` (string) and `level` (enum: beginner, intermediate, advanced, expert).
  - `participations`: Array of objects containing `projectId` (uuid), `role` (string), and `responsibilities` (string).
- **Service & Controllers (`apps/backend/src/staff`)**:
  - Update `createStaff` and `updateStaff` operations to handle nested Prisma writes for `skills` and `participations`. 
  - Ensure previous skills/participations are correctly overwritten/merged when updating a staff profile.
- **Projects Endpoint**:
  - The frontend will need to fetch existing projects to populate the dropdown. Ensure a basic GET `/api/projects` endpoint exists and is accessible.

### 2.2 Frontend Changes
- **Form UI (`apps/frontend/src/pages/staff/StaffFormPage.tsx`)**:
  - Add a **Skills** section with a dynamic list.
    - Fields: Skill Name (Text Input) and Level (Select Dropdown).
    - Buttons to "Add Skill" and "Remove" individual skills.
  - Add a **Projects** section with a dynamic list.
    - Fetch the list of existing projects on mount (via `react-query`).
    - Fields: Project (Select Dropdown), Role (Text Input), Responsibilities (Textarea).
    - Buttons to "Add Project Contribution" and "Remove" individual participations.
- **Validation**:
  - Integrate the updated `CreateStaffSchema` with the frontend form.

## 3. Data Flow
1. User loads `/staff/new` or `/staff/:id`.
2. Frontend fetches existing projects (and existing staff data if editing).
3. User fills out the basic details, adds skills, and adds project participations.
4. On submit, the payload is validated via Zod and sent to the backend.
5. Backend uses Prisma nested writes (`create`/`update` with `create`/`set`/`deleteMany` for relations) to save the staff member, their skills, and participations.

## 4. Edge Cases & Constraints
- Only existing projects can be selected for participations. Creating a new project on the fly is out of scope for this form.
- The `Participation` model has a unique constraint on `[staffId, projectId]`. We must ensure the UI prevents or the backend handles cases where the same project is selected multiple times for the same staff member.
