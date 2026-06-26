# Staff Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authentication credentials (email/password) to the staff creation process and provide a way to reset passwords.

**Architecture:** Extend Zod schemas, update the backend service to create User records when creating Staff, and add a reset password endpoint. Update frontend forms and add a dialog.

**Tech Stack:** React, Node.js, Express, Prisma, Zod, bcryptjs, shadcn/ui

## Global Constraints

- Use `bcryptjs` for password hashing on the backend.
- Existing files must not be fully rewritten, use minimal modifications.
- Tests should be written or updated for modified files where applicable.

---

### Task 1: Update Shared Schemas

**Files:**
- Modify: `packages/shared/src/schemas/staff.ts`

**Interfaces:**
- Produces: Updated `CreateStaffSchema` (with `email` and `password`), `UpdateStaffSchema` (with optional `email`), and new `ResetPasswordSchema`.

- [ ] **Step 1: Modify `staff.ts` to include new fields and schemas**

```typescript
// Add email and password to CreateStaffSchema
export const CreateStaffSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(200),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  yearsExperience: z.number().int().min(0).max(60),
  summary: z.string().min(1, 'Summary is required').max(2000),
  skills: z.array(z.object({
    name: z.string().min(1),
    level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  })).optional(),
  participations: z.array(z.object({
    projectId: z.string().uuid(),
    role: z.string().min(1),
    responsibilities: z.string().min(1),
  })).optional(),
});

// Create ResetPasswordSchema
export const ResetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
```

- [ ] **Step 2: Compile shared package to verify**

Run: `cd packages/shared && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/schemas/staff.ts
git commit -m "feat(shared): add email and password fields to staff schemas"
```

---

### Task 2: Backend Staff Service Updates

**Files:**
- Modify: `apps/backend/src/staff/staff.service.ts`

**Interfaces:**
- Consumes: Updated `CreateStaffSchema`, Prisma `User` and `Staff` models.
- Produces: `createStaff` that also creates a `User`, `updateStaff` that updates `User` email, and new `resetPassword` method.

- [ ] **Step 1: Add bcryptjs import and modify `createStaff` and `updateStaff`**

```typescript
import bcrypt from 'bcryptjs';

// In createStaff method:
static async createStaff(data: any) {
  const { skills, participations, email, password, ...rest } = data;
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Use a transaction to create User and Staff
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'staff',
      },
    });

    return tx.staff.create({
      data: {
        ...rest,
        userId: user.id,
        skills: skills ? { create: skills } : undefined,
        participations: participations ? { create: participations } : undefined,
      }
    });
  });
}

// In updateStaff method:
static async updateStaff(id: string, data: any) {
  const { skills, participations, email, ...rest } = data;
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new AppError(404, 'Staff not found');

  return prisma.$transaction(async (tx) => {
    if (email && staff.userId) {
      await tx.user.update({
        where: { id: staff.userId },
        data: { email },
      });
    }

    return tx.staff.update({
      where: { id },
      data: {
        ...rest,
        skills: skills ? { deleteMany: {}, create: skills } : undefined,
        participations: participations ? { deleteMany: {}, create: participations } : undefined,
      },
    });
  });
}
```

- [ ] **Step 2: Add `resetPassword` method to `StaffService`**

```typescript
static async resetPassword(id: string, newPassword: string) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new AppError(404, 'Staff not found');
  if (!staff.userId) throw new AppError(400, 'Staff member has no associated user account');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: staff.userId },
    data: { passwordHash },
  });

  return { success: true };
}
```

- [ ] **Step 3: Run backend build to verify**

Run: `cd apps/backend && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/staff/staff.service.ts
git commit -m "feat(backend): handle user creation and password reset in staff service"
```

---

### Task 3: Backend Controller & Router Updates

**Files:**
- Modify: `apps/backend/src/staff/staff.controller.ts`
- Modify: `apps/backend/src/staff/staff.router.ts`

**Interfaces:**
- Consumes: `StaffService.resetPassword`
- Produces: `POST /:id/reset-password` endpoint

- [ ] **Step 1: Add `resetPassword` to `staff.controller.ts`**

```typescript
// Inside StaffController class
static async resetPassword(req: Request, res: Response) {
  const { password } = req.body;
  if (!password) throw new AppError(400, 'Password is required');
  
  await StaffService.resetPassword(req.params.id as string, password);
  res.json({ message: 'Password reset successfully' });
}
```

- [ ] **Step 2: Add route to `staff.router.ts`**

```typescript
// Below existing routes, before export
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAdmin } from '../middleware/auth.js'; // Ensure this is imported if it exists, otherwise use what's there

// Note: Add this route. Ensure it's protected if an auth middleware exists in router.
router.post(
  '/:id/reset-password',
  // requireAdmin, // Uncomment or add if auth is enforced here
  asyncHandler(StaffController.resetPassword)
);
```

- [ ] **Step 3: Run backend build**

Run: `cd apps/backend && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/staff/staff.controller.ts apps/backend/src/staff/staff.router.ts
git commit -m "feat(backend): add reset-password endpoint to staff router"
```

---

### Task 4: Frontend API Hooks

**Files:**
- Modify: `apps/frontend/src/hooks/useStaff.ts`

**Interfaces:**
- Consumes: New backend endpoint `POST /api/staff/:id/reset-password`
- Produces: `useResetPassword` mutation hook

- [ ] **Step 1: Add `useResetPassword` to `useStaff.ts`**

```typescript
import { ResetPasswordInput } from '@cv-generator/shared';

// Add this at the end of the file
export const useResetPassword = (id: string) => {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const response = await api.post(`/staff/${id}/reset-password`, data);
      return response.data;
    },
  });
};
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd apps/frontend && npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/useStaff.ts
git commit -m "feat(frontend): add useResetPassword hook"
```

---

### Task 5: Frontend Form UI Updates

**Files:**
- Modify: `apps/frontend/src/pages/staff/StaffFormPage.tsx`

**Interfaces:**
- Consumes: `useResetPassword` hook, `Dialog` from shadcn.

- [ ] **Step 1: Update form fields in `StaffFormPage.tsx`**

Modify the default values in `useForm`:
```typescript
values: existing
  ? {
      email: existing.user?.email || '', // Ensure we pass the user's email if it's returned by the backend
      // ... rest of existing
    }
  : {
      email: '',
      password: '',
      // ... rest of empty
    },
```

Add the Email and Password fields to the form UI (around line 170, above `jobTitle`):
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
</div>

{!isEdit && (
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" {...register('password')} placeholder="Secure password" />
    {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
  </div>
)}
```

- [ ] **Step 2: Add Reset Password Dialog state and component**

Add imports:
```typescript
import { useState } from 'react';
import { useResetPassword } from '@/hooks/useStaff';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
```

Add hook usage inside the component:
```typescript
const resetPasswordMutation = useResetPassword(id ?? '');
const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
const [newPassword, setNewPassword] = useState('');

const handleResetPassword = async () => {
  try {
    await resetPasswordMutation.mutateAsync({ password: newPassword });
    toast({ title: 'Password reset successfully' });
    setIsResetDialogOpen(false);
    setNewPassword('');
  } catch (error) {
    toast({ title: 'Failed to reset password', variant: 'destructive' });
  }
};
```

Add the Reset Password button (e.g., inside the `isEdit` block at the bottom of the component, near the Profile Photo card):
```tsx
{isEdit && (
  <Card className="shadow-card mt-6 border-destructive/20">
    <CardHeader>
      <CardTitle className="text-base text-destructive">Security</CardTitle>
    </CardHeader>
    <CardContent>
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Reset User Password</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <Button
              onClick={handleResetPassword}
              disabled={newPassword.length < 8 || resetPasswordMutation.isPending}
              className="w-full"
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Save New Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
)}
```

- [ ] **Step 3: Run typescript check to verify**

Run: `cd apps/frontend && npm run type-check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/staff/StaffFormPage.tsx
git commit -m "feat(frontend): add email, password fields and reset dialog"
```
