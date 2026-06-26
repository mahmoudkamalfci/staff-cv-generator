# Project Staff Assignment Design

## Overview
This design covers the implementation of a feature allowing an admin to assign staff members, their roles, and contributions directly from the Project Create/Update form. It unifies what are currently separate domain objects (Projects and Participations) into a single user flow and API transaction.

## 1. Data Models & Validation (Shared Package)
- Update `CreateProjectSchema` and `UpdateProjectSchema` in `packages/shared/src/schemas/project.ts` to include an optional nested array of participations.
- Validation shape:
  ```typescript
  participations: z.array(z.object({
    staffId: z.string().uuid(),
    role: z.string().min(1, 'Role is required').max(200),
    responsibilities: z.string().min(1, 'Responsibilities are required'),
  })).optional()
  ```

## 2. Backend Implementation (Data Persistence)
The backend `projects.service.ts` will be updated to handle nested writes to guarantee atomicity.

### Creating Projects
- Use Prisma's nested `create` relation:
  ```typescript
  prisma.project.create({
    data: {
      ...projectData,
      participations: {
        create: data.participations
      }
    }
  });
  ```

### Updating Projects
- During updates, synchronizing the list of participations safely requires replacing the old assignments.
- Use a Prisma transaction to delete the existing participations for this project, then create the new ones.
  ```typescript
  await prisma.$transaction([
    prisma.participation.deleteMany({ where: { projectId: id } }),
    prisma.project.update({
      where: { id },
      data: {
        ...projectData,
        participations: {
          create: data.participations
        }
      }
    })
  ]);
  ```

## 3. Frontend Implementation (`ProjectFormPage.tsx`)
Following the rules in `AGENTS.MD` and `vercel-react-best-practices`:
- Integrate an inline "Assigned Staff" field array section at the bottom of the Project form.
- **UI Components:** We will utilize existing shadcn/ui components (`card`, `button`, `input`, `select`/dropdown). If any are missing, they must be installed via `npx shadcn@latest add <component-name>` in `apps/frontend`.
- **Form State:** Use `useFieldArray` from `react-hook-form` to manage the dynamic list of assignments.
- **Data Fetching:** Fetch the available staff members list via an SWR or React Query hook (using `client-swr-dedup` principles from Vercel best practices).
- The user can add a row, select a staff member from the dropdown, fill out the "Role" and "Contribution" (responsibilities).
- The form payload will match the updated backend schema, sending the project details and the participations array in one request.

## Security & Permissions
- These routes are already protected by `requireAuth` and `requireAdmin`. No new permission models are needed.

## Open Questions & Considerations
- *None.* We confirmed the inline form UI and backend transaction approach.
