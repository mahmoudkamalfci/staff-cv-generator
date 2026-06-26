# Project Staff Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to assign staff members, roles, and contributions directly from the Project Create/Update form in a single UI flow and backend transaction.

**Architecture:** We are updating the `Project` schema to include nested `participations`. The backend will use Prisma nested writes and transactions to atomically persist both. The frontend will use `react-hook-form`'s `useFieldArray` to manage the dynamic assignments inline in the form.

**Tech Stack:** React, React Hook Form, Zod, Express, Prisma, Tailwind v4, shadcn/ui.

## Global Constraints

- Do not use Tailwind classes that were removed in v4 (use native CSS variables for colors, avoid arbitrary values where standard tokens exist).
- Use `shadcn/ui` components for all form controls.
- Use `@tanstack/react-query` for fetching data (e.g., the staff list).

---

### Task 1: Update Shared Validation Schema

**Files:**
- Modify: `packages/shared/src/schemas/project.ts`

**Interfaces:**
- Produces: Updated `CreateProjectSchema` and `UpdateProjectSchema` that accept an optional `participations` array `[{ staffId, role, responsibilities }]`.

- [ ] **Step 1: Write the failing test or verify current state**
Since the `shared` package doesn't have a test runner configured explicitly (though we could run `tsc`), we'll just implement the schema.

- [ ] **Step 2: Update the schema implementation**

```typescript
// in packages/shared/src/schemas/project.ts
import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(300),
  description: z.string().min(1, 'Description is required'),
  client: z.string().min(1, 'Client is required').max(200),
  location: z.string().min(1, 'Location is required').max(200),
  startDate: z.string().date('Invalid date format, use YYYY-MM-DD'),
  endDate: z.string().date().nullable().optional(),
  technologies: z.array(z.string().min(1)).min(1, 'At least one technology is required'),
  participations: z.array(
    z.object({
      staffId: z.string().uuid('Invalid staff ID'),
      role: z.string().min(1, 'Role is required').max(200),
      responsibilities: z.string().min(1, 'Responsibilities are required'),
    })
  ).optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();
// ...rest of the file remains the same
```

- [ ] **Step 3: Verify the types compile**

Run: `npm run type-check --workspace=@cv-generator/shared`
Expected: PASS (or no output)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/schemas/project.ts
git commit -m "feat(shared): add participations to Project creation schema"
```

---

### Task 2: Update Backend Project Service

**Files:**
- Modify: `apps/backend/src/projects/projects.service.ts`
- Modify: `apps/backend/src/projects/projects.service.test.ts`

**Interfaces:**
- Consumes: `CreateProjectInput` and `UpdateProjectInput` from `@cv-generator/shared`
- Produces: Service methods that handle Prisma transactions for participations.

- [ ] **Step 1: Write the failing test**

Modify `apps/backend/src/projects/projects.service.test.ts` to expect nested participation creation.

```typescript
// in apps/backend/src/projects/projects.service.test.ts
// Add a test case for createProject
test('createProject creates a project with participations', async () => {
  const data = {
    name: 'New Project',
    description: 'Test',
    client: 'Client',
    location: 'Location',
    startDate: '2026-01-01',
    technologies: ['React'],
    participations: [
      { staffId: '123e4567-e89b-12d3-a456-426614174000', role: 'Dev', responsibilities: 'Coding' }
    ]
  };
  
  // mock prisma.project.create
  (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'proj-1', ...data });
  
  const result = await ProjectsService.createProject(data);
  expect(prisma.project.create).toHaveBeenCalledWith({
    data: {
      name: 'New Project',
      description: 'Test',
      client: 'Client',
      location: 'Location',
      startDate: '2026-01-01',
      technologies: ['React'],
      participations: {
        create: data.participations
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test --workspace=@cv-generator/backend projects.service.test.ts`
Expected: FAIL (because current implementation doesn't map `participations` to `{ create: ... }`)

- [ ] **Step 3: Write minimal implementation**

```typescript
// in apps/backend/src/projects/projects.service.ts
  static async createProject(data: any) {
    const { participations, ...projectData } = data;
    
    return prisma.project.create({ 
      data: {
        ...projectData,
        ...(participations && participations.length > 0 ? {
          participations: {
            create: participations
          }
        } : {})
      }
    });
  }

  static async updateProject(id: string, data: any) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError(404, 'Project not found');

    const { participations, ...projectData } = data;

    if (participations) {
      // Use transaction to replace participations
      const [updatedProject] = await prisma.$transaction([
        prisma.project.update({
          where: { id },
          data: {
            ...projectData,
            participations: {
              deleteMany: {}, // Delete existing
              create: participations // Create new ones
            }
          }
        })
      ]);
      return updatedProject;
    }

    return prisma.project.update({
      where: { id },
      data: projectData,
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test --workspace=@cv-generator/backend projects.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects/projects.service.ts apps/backend/src/projects/projects.service.test.ts
git commit -m "feat(backend): support inline participations for projects"
```

---

### Task 3: Update Frontend Form (`ProjectFormPage.tsx`)

**Files:**
- Modify: `apps/frontend/src/pages/projects/ProjectFormPage.tsx`

**Interfaces:**
- Consumes: `@cv-generator/shared` `CreateProjectSchema`, `useQuery` for fetching staff.
- Produces: A unified form submitting the project and staff assignments together.

- [ ] **Step 1: Check existing UI components**

Run: `ls apps/frontend/src/components/ui/`
Check if `select.tsx`, `card.tsx`, `button.tsx`, `input.tsx` are present. If `select.tsx` is missing, run: `npx shadcn@latest add select` in `apps/frontend`.

- [ ] **Step 2: Add `useFieldArray` and Staff Fetching to the form**

```tsx
// Inside apps/frontend/src/pages/projects/ProjectFormPage.tsx
// Add imports:
import { useFieldArray } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Trash2, Plus } from 'lucide-react';
// Import UI components if they exist, or standard HTML if they don't, but assuming we have Input, Button, Card...

// Fetch staff hook inside the component
const { data: staffList } = useQuery({
  queryKey: ['staff'],
  queryFn: async () => {
    const res = await axios.get('/api/staff', { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
    });
    return res.data.data; // adjust based on actual API response shape
  }
});

// Setup useFieldArray inside the component:
const { fields, append, remove } = useFieldArray({
  control: form.control,
  name: "participations"
});
```

- [ ] **Step 3: Implement the Field Array UI in the JSX**

```tsx
// Inside the form JSX, before the submit button:
<div className="space-y-4 mt-8">
  <div className="flex justify-between items-center">
    <h3 className="text-lg font-medium">Assigned Staff</h3>
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      onClick={() => append({ staffId: '', role: '', responsibilities: '' })}
    >
      <Plus className="w-4 h-4 mr-2" /> Add Staff Member
    </Button>
  </div>

  {fields.map((field, index) => (
    <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md relative">
      <div className="flex-1 space-y-4">
        {/* Staff Selection Dropdown (using standard select or shadcn Select) */}
        <div>
          <label className="text-sm font-medium">Staff Member</label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register(`participations.${index}.staffId`)}
          >
            <option value="">Select Staff...</option>
            {staffList?.map((staff: any) => (
              <option key={staff.id} value={staff.id}>{staff.name} - {staff.jobTitle}</option>
            ))}
          </select>
          {form.formState.errors.participations?.[index]?.staffId && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.participations[index]?.staffId?.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Role</label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. Lead Developer"
            {...form.register(`participations.${index}.role`)} 
          />
        </div>

        <div>
          <label className="text-sm font-medium">Responsibilities</label>
          <textarea 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="e.g. Architected the backend and managed deployments."
            {...form.register(`participations.${index}.responsibilities`)} 
          />
        </div>
      </div>
      
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="text-red-500 mt-6"
        onClick={() => remove(index)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Verify frontend builds and type-checks**

Run: `npm run type-check --workspace=@cv-generator/frontend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/pages/projects/ProjectFormPage.tsx
git commit -m "feat(frontend): add inline staff assignments to project form"
```
