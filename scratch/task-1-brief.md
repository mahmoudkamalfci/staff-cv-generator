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
