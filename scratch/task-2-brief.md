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
