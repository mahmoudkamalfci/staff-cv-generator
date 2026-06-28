# Staff Profile and Projects Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure the backend to allow staff to edit their own profiles and only view their assigned projects, with frontend UI adjustments to match.

**Architecture:** Use role-based checks inside the backend controllers for `StaffController` and `ProjectsController` to enforce permissions dynamically instead of global route middleware. Adjust React frontend to conditionally render actions based on `user.role` and `user.id`.

**Tech Stack:** Express, Node.js, Prisma, React, Tailwind

## Global Constraints

- Must follow the spec defined in `docs/superpowers/specs/2026-06-28-staff-permissions-design.md`
- Backend edits must preserve existing admin capabilities

---

### Task 1: Update Staff Profile Editing API

**Files:**
- Modify: `apps/backend/src/staff/staff.router.ts:21-27`
- Modify: `apps/backend/src/staff/staff.controller.ts`

**Interfaces:**
- Consumes: `req.user` from `requireAuth` middleware
- Produces: `PATCH /api/staff/:id` allows self-edit for staff

- [ ] **Step 1: Remove `requireAdmin` from the PATCH route**

```typescript
// apps/backend/src/staff/staff.router.ts
// Change:
staffRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(UpdateStaffSchema),
  asyncHandler(StaffController.updateStaff),
);

// To:
staffRouter.patch(
  '/:id',
  requireAuth,
  validate(UpdateStaffSchema),
  asyncHandler(StaffController.updateStaff),
);
```

- [ ] **Step 2: Add authorization logic to `updateStaff` controller**

```typescript
// apps/backend/src/staff/staff.controller.ts
// Add this logic before the service call in updateStaff:
  static async updateStaff(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = req.user;

    if (user?.role !== 'admin') {
      const staff = await StaffService.getStaffById(id);
      if (!staff || staff.userId !== user?.userId) {
        res.status(403).json({ error: 'Forbidden: You can only edit your own profile' });
        return;
      }
    }

    const updatedStaff = await StaffService.updateStaff(id, req.body);
    res.json({ data: updatedStaff });
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/staff/staff.router.ts apps/backend/src/staff/staff.controller.ts
git commit -m "feat(backend): allow staff members to edit their own profile"
```

---

### Task 2: Update Projects Viewing API

**Files:**
- Modify: `apps/backend/src/projects/projects.service.ts`
- Modify: `apps/backend/src/projects/projects.controller.ts`

**Interfaces:**
- Consumes: Prisma Client, `req.user`
- Produces: `ProjectsService.getProjects(..., staffId)` filtered by assigned staff

- [ ] **Step 1: Update `ProjectsService.getProjects` to accept `staffId` and filter**

```typescript
// apps/backend/src/projects/projects.service.ts
// Modify the getProjects method signature and where clause
  static async getProjects(page = 1, limit = 20, search?: string, staffId?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { client: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(staffId ? { participations: { some: { staffId } } } : {}),
    };
    // ... rest remains the same
```

- [ ] **Step 2: Update `ProjectsController.getProjects` to pass `staffId`**

```typescript
// apps/backend/src/projects/projects.controller.ts
// Update to fetch the user's staff record if they are 'staff'
import { prisma } from '../db/client.js';

  static async getProjects(req: Request, res: Response) {
    let page = parseInt(req.query.page as string, 10);
    if (isNaN(page) || page < 1) page = 1;
    let limit = parseInt(req.query.limit as string, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    limit = Math.min(limit, 100);

    const search = req.query.search as string | undefined;
    let staffId: string | undefined = undefined;

    if (req.user && req.user.role === 'staff') {
      const staffRecord = await prisma.staff.findUnique({
        where: { userId: req.user.userId },
        select: { id: true }
      });
      if (staffRecord) {
        staffId = staffRecord.id;
      } else {
        // Staff user has no profile yet, return empty list safely
        res.json({ data: [], pagination: { page, limit, total: 0 } });
        return;
      }
    }

    const { projects, total } = await ProjectsService.getProjects(page, limit, search, staffId);
    res.json({ data: projects, pagination: { page, limit, total } });
  }
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/projects/projects.service.ts apps/backend/src/projects/projects.controller.ts
git commit -m "feat(backend): filter projects to assigned projects for staff members"
```

---

### Task 3: Update Frontend Staff Profiles (UI restrictions)

**Files:**
- Modify: `apps/frontend/src/pages/staff/StaffDetailPage.tsx`

**Interfaces:**
- Consumes: `useAuth` hook (`user.id` and `user.role`), `staff.userId`

- [ ] **Step 1: Update UI to hide Edit and Delete buttons for unauthorized staff**

```typescript
// apps/frontend/src/pages/staff/StaffDetailPage.tsx
// Add check for `user` from auth hook
import { useAuth } from '@/hooks/useAuth';

// inside the component:
const { user } = useAuth();
const canEdit = user?.role === 'admin' || user?.id === staff?.userId;
const canDelete = user?.role === 'admin';

// replace the Action buttons div
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link to={`/staff/${id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/staff/StaffDetailPage.tsx
git commit -m "feat(frontend): restrict staff profile edit/delete buttons based on role"
```

---

### Task 4: Update Frontend Projects Page (UI restrictions)

**Files:**
- Modify: `apps/frontend/src/pages/projects/ProjectListPage.tsx`
- Modify: `apps/frontend/src/pages/projects/ProjectDetailPage.tsx`

**Interfaces:**
- Consumes: `useAuth` hook

- [ ] **Step 1: Hide management actions in ProjectListPage**

```typescript
// apps/frontend/src/pages/projects/ProjectListPage.tsx
import { useAuth } from '@/hooks/useAuth';

// inside component:
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// wrap the "New Project" link:
{isAdmin && (
  <Button asChild>
    <Link to="/projects/new">
      <Plus className="w-4 h-4 mr-2" />
      New Project
    </Link>
  </Button>
)}

// wrap the row actions (Edit/Delete) in the table:
{isAdmin && (
  <TableCell className="text-right">
    {/* ... dropdown menu ... */}
  </TableCell>
)}
// Make sure to also hide the <th>Actions</th> conditionally in the thead.
```

- [ ] **Step 2: Hide management actions in ProjectDetailPage**

```typescript
// apps/frontend/src/pages/projects/ProjectDetailPage.tsx
import { useAuth } from '@/hooks/useAuth';

// inside component:
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// wrap action buttons
<div className="flex items-center space-x-2">
  {isAdmin && (
    <>
      <Button variant="outline" asChild>
        <Link to={`/projects/${id}/edit`}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Project
        </Link>
      </Button>
      <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </>
  )}
</div>

// hide the Assign Staff button
{isAdmin && (
  <Button variant="outline" size="sm" asChild>
    <Link to={`/projects/${id}/edit`}>Assign Staff</Link>
  </Button>
)}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/projects/ProjectListPage.tsx apps/frontend/src/pages/projects/ProjectDetailPage.tsx
git commit -m "feat(frontend): hide project management buttons for staff members"
```
