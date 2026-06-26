### Task 3: Update Frontend Form (`ProjectFormPage.tsx`)

**Files:**
- Modify: `apps/frontend/src/pages/projects/ProjectFormPage.tsx`

**Interfaces:**
- Consumes: `@cv-generator/shared` `CreateProjectSchema`, `useQuery` for fetching staff.
- Produces: A unified form submitting the project and staff assignments together.

- [ ] **Step 1: Check existing UI components**

Run: `ls apps/frontend/src/components/ui/`
Check if `select.tsx`, `card.tsx`, `button.tsx`, `input.tsx` are present. If `select.tsx` is missing, run: `npx shadcn@latest add select` in `apps/frontend`.
Since you are a subagent, you can use the `run_command` tool to do this.

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
