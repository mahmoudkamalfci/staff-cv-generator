# CV Generator — Plan 4: Frontend Feature Pages & CV Templates

## ⚡ Best Practice Updates (Applied from Vercel React Review)

- Fix 1 (P0): `bundle-dynamic-imports` — CV templates lazy-loaded with React.lazy
- Fix 2 (P0): `bundle-dynamic-imports` — @react-pdf/renderer loaded on-demand only
- Fix 3 (P1): `async-suspense-boundaries` — CVPreviewPage split into static shell + Suspense data zone
- Fix 4 (P1): `rerender-derived-state-no-effect` — Form hydration replaced with defaultValues + key prop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all feature pages (Dashboard, Staff, Projects, CV Generator) and the three CV template components (Classic, Modern, Compact) with full CRUD forms and print-ready CV preview.

**Architecture:** Each page uses React Query (`useQuery`/`useMutation`) for data fetching/mutation, React Hook Form + Zod for form validation, and shadcn/ui components. Data hooks are extracted into `src/hooks/` for reuse. CV templates are React components receiving `CVData` from `@cv-generator/shared` and rendering a print-ready layout.

**Tech Stack:** React Query v5, React Hook Form, Zod (from @cv-generator/shared), shadcn/ui, lucide-react, Tailwind v4

## Global Constraints

- All API calls go through the `api` instance from `@/lib/api`
- All forms use `react-hook-form` + `zodResolver` from `@cv-generator/shared` schemas
- All mutations show a toast on success and log error to console on failure
- Photo upload uses `FormData` with `Content-Type: multipart/form-data`
- CV Preview page adds `no-print` class to all non-CV elements; the CV wrapper has no screen-only chrome
- All data-fetching hooks live in `src/hooks/` and are named `useStaff`, `useProject`, etc.
- `useAuth().user.role === 'admin'` gates all create/edit/delete UI

---

### Task 1: Data Hooks (React Query)

**Files:**

- Create: `apps/frontend/src/hooks/useStaff.ts`
- Create: `apps/frontend/src/hooks/useProjects.ts`
- Create: `apps/frontend/src/hooks/useTemplates.ts`
- Create: `apps/frontend/src/hooks/useCVData.ts`

**Interfaces:**

- Produces:
  - `useStaffList()` → `{ data: Staff[], isLoading, error }`
  - `useStaffDetail(id)` → `{ data: StaffWithSkills, isLoading, error }`
  - `useCreateStaff()` → mutation
  - `useUpdateStaff(id)` → mutation
  - `useDeleteStaff()` → mutation
  - `useAddSkill(staffId)` → mutation
  - `useDeleteSkill()` → mutation
  - `useProjectList()` → `{ data: Project[], isLoading, error }`
  - `useProjectDetail(id)` → `{ data: Project & participations, isLoading, error }`
  - `useCreateProject()` → mutation
  - `useUpdateProject(id)` → mutation
  - `useDeleteProject()` → mutation
  - `useCreateParticipation()` → mutation
  - `useDeleteParticipation()` → mutation
  - `useTemplateList()` → `{ data: CVTemplate[], isLoading, error }`
  - `useCVData(staffId, templateId)` → `{ data: CVData, isLoading, error }`

- [ ] **Step 1: Create `apps/frontend/src/hooks/useStaff.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Staff,
  StaffWithSkills,
  CreateStaffInput,
  UpdateStaffInput,
  CreateSkillInput,
} from '@cv-generator/shared';

export const staffKeys = {
  all: ['staff'] as const,
  detail: (id: string) => ['staff', id] as const,
  skills: (id: string) => ['staff', id, 'skills'] as const,
};

export function useStaffList() {
  return useQuery({
    queryKey: staffKeys.all,
    queryFn: () => api.get<Staff[]>('/staff').then((r) => r.data),
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => api.get<StaffWithSkills>(`/staff/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) => api.post<Staff>('/staff', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useUpdateStaff(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStaffInput) =>
      api.patch<Staff>(`/staff/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: staffKeys.detail(id) });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/staff/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.all }),
  });
}

export function useUploadStaffPhoto(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return api
        .post<{ photoUrl: string }>(`/staff/${staffId}/photo`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
  });
}

export function useAddSkill(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillInput) =>
      api.post(`/staff/${staffId}/skills`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
  });
}

export function useDeleteSkill(staffId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => api.delete(`/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: staffKeys.detail(staffId) }),
  });
}

export function useStaffParticipations(staffId: string) {
  return useQuery({
    queryKey: ['staff', staffId, 'participations'],
    queryFn: () => api.get(`/staff/${staffId}/participations`).then((r) => r.data),
    enabled: !!staffId,
  });
}
```

- [ ] **Step 2: Create `apps/frontend/src/hooks/useProjects.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  CreateParticipationInput,
  UpdateParticipationInput,
} from '@cv-generator/shared';

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.all,
    queryFn: () => api.get<Project[]>('/projects').then((r) => r.data),
  });
}

export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.get<Project>(`/projects/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      api.post<Project>('/projects', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProjectInput) =>
      api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useCreateParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParticipationInput) =>
      api.post('/participations', data).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      qc.invalidateQueries({ queryKey: ['staff', variables.staffId, 'participations'] });
    },
  });
}

export function useDeleteParticipation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/participations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
```

- [ ] **Step 3: Create `apps/frontend/src/hooks/useTemplates.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVTemplate } from '@cv-generator/shared';

export function useTemplateList() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get<CVTemplate[]>('/templates').then((r) => r.data),
  });
}
```

- [ ] **Step 4: Create `apps/frontend/src/hooks/useCVData.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVData } from '@cv-generator/shared';

export function useCVData(staffId: string, templateId: string) {
  return useQuery({
    queryKey: ['cv', staffId, templateId],
    queryFn: () => api.get<CVData>(`/cv/${staffId}/${templateId}`).then((r) => r.data),
    enabled: !!staffId && !!templateId,
    staleTime: 0, // Always fresh — generates audit log on backend
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/hooks
git commit -m "feat(frontend): add React Query data hooks for staff, projects, templates, CV"
```

---

### Task 2: Dashboard Page

**Files:**

- Modify: `apps/frontend/src/pages/dashboard/DashboardPage.tsx`

**Interfaces:**

- Consumes: `useStaffList`, `useProjectList`, `useTemplateList`
- Produces: Dashboard page showing stat cards (staff count, project count, template count) and a welcome message

- [ ] **Step 1: Replace `apps/frontend/src/pages/dashboard/DashboardPage.tsx`**

```tsx
import { Users, FolderKanban, LayoutTemplate, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaffList } from '@/hooks/useStaff';
import { useProjectList } from '@/hooks/useProjects';
import { useTemplateList } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  to: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, color, to, isLoading }: StatCardProps) {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <Link to={to}>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-xs text-muted-foreground hover:text-foreground px-0"
          >
            View all →
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: projects, isLoading: projectsLoading } = useProjectList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-muted-foreground mt-1">Here's what's in your CV generator today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Staff Members"
          value={staff?.length}
          icon={Users}
          color="bg-accent/15 text-accent"
          to="/staff"
          isLoading={staffLoading}
        />
        <StatCard
          title="Projects"
          value={projects?.length}
          icon={FolderKanban}
          color="bg-primary/15 text-primary"
          to="/projects"
          isLoading={projectsLoading}
        />
        <StatCard
          title="CV Templates"
          value={templates?.length}
          icon={LayoutTemplate}
          color="bg-success/15 text-success"
          to="/templates"
          isLoading={templatesLoading}
        />
      </div>

      {/* Quick Action */}
      <Card className="shadow-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-accent" />
            Generate a CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Select a staff member and a template to generate a professional CV for your next
            proposal.
          </p>
          <Link to="/cv">
            <Button variant="accent">Open CV Generator</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/dashboard
git commit -m "feat(frontend): implement dashboard page with stat cards"
```

---

### Task 3: Staff Pages (List, Detail, Form)

**Files:**

- Modify: `apps/frontend/src/pages/staff/StaffListPage.tsx`
- Modify: `apps/frontend/src/pages/staff/StaffDetailPage.tsx`
- Modify: `apps/frontend/src/pages/staff/StaffFormPage.tsx`
- Create: `apps/frontend/src/components/staff/SkillBadge.tsx`
- Create: `apps/frontend/src/components/staff/SkillsManager.tsx`

**Interfaces:**

- Consumes: `useStaffList`, `useStaffDetail`, `useCreateStaff`, `useUpdateStaff`, `useDeleteStaff`, `useAddSkill`, `useDeleteSkill`, `useUploadStaffPhoto`

- [ ] **Step 1: Create `apps/frontend/src/components/staff/SkillBadge.tsx`**

```tsx
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Skill, SkillLevel } from '@cv-generator/shared';
import { cn } from '@/lib/utils';

const levelColors: Record<SkillLevel, string> = {
  beginner: 'bg-muted text-muted-foreground',
  intermediate: 'bg-warning/20 text-warning-foreground',
  advanced: 'bg-accent/20 text-accent',
  expert: 'bg-success/20 text-success',
};

interface SkillBadgeProps {
  skill: Skill;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function SkillBadge({ skill, onDelete, canDelete }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        levelColors[skill.level],
      )}
    >
      {skill.name}
      <span className="opacity-60 text-[10px]">({skill.level})</span>
      {canDelete && onDelete && (
        <button
          onClick={() => onDelete(skill.id)}
          className="hover:opacity-70 transition-opacity ml-0.5"
          aria-label={`Remove ${skill.name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Create `apps/frontend/src/components/staff/SkillsManager.tsx`**

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2 } from 'lucide-react';
import { CreateSkillSchema, type CreateSkillInput, type Skill } from '@cv-generator/shared';
import { useAddSkill, useDeleteSkill } from '@/hooks/useStaff';
import { SkillBadge } from './SkillBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SkillsManagerProps {
  staffId: string;
  skills: Skill[];
  canEdit: boolean;
}

export function SkillsManager({ staffId, skills, canEdit }: SkillsManagerProps) {
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const addSkill = useAddSkill(staffId);
  const deleteSkill = useDeleteSkill(staffId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateSkillInput>({
    resolver: zodResolver(CreateSkillSchema),
  });

  const onSubmit = async (data: CreateSkillInput) => {
    await addSkill.mutateAsync(data);
    toast({ title: 'Skill added' });
    reset();
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSkill.mutateAsync(id);
    toast({ title: 'Skill removed' });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 && (
          <p className="text-muted-foreground text-sm">No skills added yet.</p>
        )}
        {skills.map((skill) => (
          <SkillBadge key={skill.id} skill={skill} onDelete={handleDelete} canDelete={canEdit} />
        ))}
      </div>

      {canEdit && !adding && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Skill
        </Button>
      )}

      {adding && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="skill-name" className="text-xs">
              Skill name
            </Label>
            <Input
              id="skill-name"
              {...register('name')}
              placeholder="e.g. React"
              className="h-8 w-40"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Level</Label>
            <Select onValueChange={(v) => setValue('level', v as CreateSkillInput['level'])}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {['beginner', 'intermediate', 'advanced', 'expert'].map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={addSkill.isPending}>
            {addSkill.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace `apps/frontend/src/pages/staff/StaffListPage.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useStaffList, useDeleteStaff } from '@/hooks/useStaff';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

export default function StaffListPage() {
  const { data: staff, isLoading } = useStaffList();
  const { user } = useAuth();
  const deleteStaff = useDeleteStaff();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const filtered = staff?.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return;
    await deleteStaff.mutateAsync(id);
    toast({ title: `${name} removed` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Staff Members</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {staff?.length ?? 0} members in the system
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/staff/new">
            <Button variant="accent">
              <Plus className="w-4 h-4 mr-2" /> Add Staff
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or job title…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : filtered?.map((member) => (
              <Card
                key={member.id}
                className="shadow-card hover:shadow-elevated transition-shadow duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.photoUrl ?? undefined} alt={member.name} />
                      <AvatarFallback className="bg-accent/20 text-accent font-bold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.jobTitle}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''} exp
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <Link to={`/staff/${member.id}`}>
                      <Button variant="ghost" size="icon" title="View profile">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    {user?.role === 'admin' && (
                      <>
                        <Link to={`/staff/${member.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(member.id, member.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No staff members found.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Replace `apps/frontend/src/pages/staff/StaffDetailPage.tsx`**

```tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText, Loader2 } from 'lucide-react';
import { useStaffDetail } from '@/hooks/useStaff';
import { useAuth } from '@/hooks/useAuth';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkillsManager } from '@/components/staff/SkillsManager';
import { getInitials, formatDate } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: staff, isLoading } = useStaffDetail(id!);
  const { data: templates } = useTemplateList();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!staff) return <p className="text-muted-foreground">Staff member not found.</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <Link to="/staff">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Staff
          </Button>
        </Link>
        {user?.role === 'admin' && (
          <Link to={`/staff/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-20 h-20">
              <AvatarImage src={staff.photoUrl ?? undefined} alt={staff.name} />
              <AvatarFallback className="bg-accent/20 text-accent text-xl font-bold">
                {getInitials(staff.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{staff.name}</h2>
              <p className="text-muted-foreground">{staff.jobTitle}</p>
              <Badge variant="secondary" className="mt-2">
                {staff.yearsExperience} year{staff.yearsExperience !== 1 ? 's' : ''} experience
              </Badge>
              <Separator className="my-4" />
              <p className="text-sm text-foreground leading-relaxed">{staff.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsManager
            staffId={id!}
            skills={staff.skills ?? []}
            canEdit={user?.role === 'admin'}
          />
        </CardContent>
      </Card>

      {/* Generate CV */}
      <Card className="shadow-card border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-accent" />
            Generate CV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <Select onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="accent"
            disabled={!selectedTemplate}
            onClick={() => navigate(`/cv/preview/${id}/${selectedTemplate}`)}
          >
            Generate CV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 5: Replace `apps/frontend/src/pages/staff/StaffFormPage.tsx`**

```tsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { CreateStaffSchema, type CreateStaffInput } from '@cv-generator/shared';
import {
  useStaffDetail,
  useCreateStaff,
  useUpdateStaff,
  useUploadStaffPhoto,
} from '@/hooks/useStaff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export default function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading } = useStaffDetail(id ?? '');
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff(id ?? '');
  const uploadPhoto = useUploadStaffPhoto(id ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          jobTitle: existing.jobTitle,
          yearsExperience: existing.yearsExperience,
          summary: existing.summary,
        }
      : undefined,
  });

  const onSubmit = async (data: CreateStaffInput) => {
    if (isEdit) {
      await updateStaff.mutateAsync(data);
      toast({ title: 'Profile updated' });
      navigate(`/staff/${id}`);
    } else {
      const created = await createStaff.mutateAsync(data);
      toast({ title: 'Staff member added' });
      navigate(`/staff/${created.id}`);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadPhoto.mutateAsync(file);
    toast({ title: 'Photo updated' });
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in" key={id ?? 'new'}>
      <div className="flex items-center gap-4">
        <Link to={isEdit ? `/staff/${id}` : '/staff'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
        </h2>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} placeholder="John Doe" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                {...register('jobTitle')}
                placeholder="Senior Software Engineer"
              />
              {errors.jobTitle && (
                <p className="text-destructive text-xs">{errors.jobTitle.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                max={60}
                {...register('yearsExperience', { valueAsNumber: true })}
              />
              {errors.yearsExperience && (
                <p className="text-destructive text-xs">{errors.yearsExperience.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Profile Summary</Label>
              <textarea
                id="summary"
                {...register('summary')}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Brief professional summary…"
              />
              {errors.summary && (
                <p className="text-destructive text-xs">{errors.summary.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : isEdit ? (
                'Update Profile'
              ) : (
                'Create Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isEdit && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploadPhoto.isPending}
            >
              {uploadPhoto.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Upload Photo
                </>
              )}
            </Button>
            <p className="text-muted-foreground text-xs mt-2">JPG, PNG, or WebP. Max 5MB.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/pages/staff apps/frontend/src/components/staff
git commit -m "feat(frontend): implement staff list, detail, and form pages"
```

---

### Task 4: Project Pages

**Files:**

- Modify: `apps/frontend/src/pages/projects/ProjectListPage.tsx`
- Modify: `apps/frontend/src/pages/projects/ProjectDetailPage.tsx`
- Modify: `apps/frontend/src/pages/projects/ProjectFormPage.tsx`

**Interfaces:**

- Consumes: `useProjectList`, `useProjectDetail`, `useCreateProject`, `useUpdateProject`, `useDeleteProject`, `useCreateParticipation`, `useDeleteParticipation`

- [ ] **Step 1: Replace `apps/frontend/src/pages/projects/ProjectListPage.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Pencil, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useProjectList, useDeleteProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

export default function ProjectListPage() {
  const { data: projects, isLoading } = useProjectList();
  const { user } = useAuth();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const filtered = projects?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    await deleteProject.mutateAsync(id);
    toast({ title: `"${name}" deleted` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {projects?.length ?? 0} projects in the system
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/projects/new">
            <Button variant="accent">
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Button>
          </Link>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or client…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-5">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          : filtered?.map((project) => (
              <Card
                key={project.id}
                className="shadow-card hover:shadow-elevated transition-shadow duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <Badge variant="outline">{project.client}</Badge>
                        {project.endDate === null && (
                          <Badge className="bg-success/20 text-success border-0 text-xs">
                            Ongoing
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(project.startDate)} — {formatDate(project.endDate)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(project.technologies as string[]).slice(0, 6).map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                        {(project.technologies as string[]).length > 6 && (
                          <span className="text-xs text-muted-foreground">
                            +{(project.technologies as string[]).length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {user?.role === 'admin' && (
                        <>
                          <Link to={`/projects/${project.id}/edit`}>
                            <Button variant="ghost" size="icon" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(project.id, project.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found.</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace `apps/frontend/src/pages/projects/ProjectFormPage.tsx`**

```tsx
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { CreateProjectSchema, type CreateProjectInput } from '@cv-generator/shared';
import { useProjectDetail, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: existing, isLoading } = useProjectDetail(id ?? '');
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(id ?? '');

  const [techInput, setTechInput] = useState('');

  // Fix 4 (P1): rerender-derived-state-no-effect
  // CORRECT: Use defaultValues from the query result. Never use useEffect + reset() to hydrate
  // form fields — it causes an extra render cycle. Use a key={projectId} prop on the form
  // component (or wrapping Card) to trigger a clean remount when the entity ID changes.
  //
  // The parent route should render: <ProjectFormPage key={id ?? 'new'} />
  // so that switching between create and edit modes unmounts and remounts the form.
  const existingTechs = (existing?.technologies as string[] | undefined) ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          description: existing.description,
          client: existing.client,
          location: existing.location,
          startDate: String(existing.startDate),
          endDate: existing.endDate ? String(existing.endDate) : null,
          technologies: existingTechs,
        }
      : undefined,
  });

  // Sync technologies local state from query data on first load (create mode starts empty)
  const [technologies, setTechnologies] = useState<string[]>(existingTechs);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !technologies.includes(t)) setTechnologies((prev) => [...prev, t]);
    setTechInput('');
  };

  const removeTech = (tech: string) => setTechnologies((prev) => prev.filter((t) => t !== tech));

  const onSubmit = async (data: CreateProjectInput) => {
    const payload = { ...data, technologies };
    if (isEdit) {
      await updateProject.mutateAsync(payload);
      toast({ title: 'Project updated' });
      navigate(`/projects/${id}`);
    } else {
      const created = await createProject.mutateAsync(payload);
      toast({ title: 'Project created' });
      navigate(`/projects/${created.id}`);
    }
  };

  if (isEdit && isLoading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to={isEdit ? `/projects/${id}` : '/projects'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Project' : 'Add Project'}
        </h2>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" {...register('name')} placeholder="Enterprise ERP System" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input id="client" {...register('client')} placeholder="Acme Corp" />
                {errors.client && (
                  <p className="text-destructive text-xs">{errors.client.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} placeholder="Cairo, Egypt" />
                {errors.location && (
                  <p className="text-destructive text-xs">{errors.location.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-destructive text-xs">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (leave empty if ongoing)</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Project overview…"
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <Label>Technologies</Label>
              <div className="flex gap-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  placeholder="e.g. React, Node.js"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addTech}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.technologies && (
                <p className="text-destructive text-xs">At least one technology is required</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : isEdit ? (
                'Update Project'
              ) : (
                'Create Project'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Implement `ProjectDetailPage.tsx`** — show project info + assigned staff. Implementation follows same pattern as StaffDetailPage: fetch with `useProjectDetail(id)`, render project metadata, technology tags, and a list of participations with staff names.

Create `apps/frontend/src/pages/projects/ProjectDetailPage.tsx`:

```tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2, Calendar, MapPin, Building2, Users } from 'lucide-react';
import { useProjectDetail } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading } = useProjectDetail(id!);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (!project) return <p className="text-muted-foreground">Project not found.</p>;

  const p = project as typeof project & {
    participations?: Array<{
      id: string;
      staffId: string;
      role: string;
      responsibilities: string;
      staffName?: string;
      staffJobTitle?: string;
    }>;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>
        </Link>
        {user?.role === 'admin' && (
          <Link to={`/projects/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{project.name}</h2>
              {project.endDate === null && (
                <Badge className="bg-success/20 text-success border-0 mt-1">Ongoing</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" /> {project.client}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" /> {project.location}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" /> {formatDate(project.startDate)} —{' '}
              {formatDate(project.endDate)}
            </div>
          </div>
          <Separator />
          <p className="text-foreground leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {(project.technologies as string[]).map((tech) => (
              <span
                key={tech}
                className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {p.participations && p.participations.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" /> Assigned Staff ({p.participations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p.participations.map((part) => (
              <div key={part.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/staff/${part.staffId}`}
                      className="font-medium text-foreground hover:text-accent transition-colors"
                    >
                      {part.staffName ?? 'Staff Member'}
                    </Link>
                    <p className="text-sm text-muted-foreground">{part.staffJobTitle}</p>
                  </div>
                  <Badge variant="secondary">{part.role}</Badge>
                </div>
                <p className="text-sm text-foreground mt-2">{part.responsibilities}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/pages/projects
git commit -m "feat(frontend): implement project list, detail, and form pages"
```

---

### Task 5: CV Generator Page & Templates Browser

**Files:**

- Modify: `apps/frontend/src/pages/cv/CVGeneratorPage.tsx`
- Modify: `apps/frontend/src/pages/templates/TemplatesPage.tsx`

- [ ] **Step 1: Replace `apps/frontend/src/pages/cv/CVGeneratorPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, LayoutTemplate } from 'lucide-react';
import { useStaffList } from '@/hooks/useStaff';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export default function CVGeneratorPage() {
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const navigate = useNavigate();

  const selectedStaff = staff?.find((s) => s.id === selectedStaffId);
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleGenerate = () => {
    if (selectedStaffId && selectedTemplateId) {
      navigate(`/cv/preview/${selectedStaffId}/${selectedTemplateId}`);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">CV Generator</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a staff member and a template to generate a professional CV.
        </p>
      </div>

      {/* Step 1: Select Staff */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              1
            </span>
            Select Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedStaffId} disabled={staffLoading}>
            <SelectTrigger>
              <SelectValue placeholder={staffLoading ? 'Loading…' : 'Choose a staff member'} />
            </SelectTrigger>
            <SelectContent>
              {staff?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground text-xs">— {s.jobTitle}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStaff && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedStaff.photoUrl ?? undefined} />
                <AvatarFallback className="bg-accent/20 text-accent text-sm font-bold">
                  {getInitials(selectedStaff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStaff.jobTitle}</p>
              </div>
              <Badge variant="secondary" className="ml-auto text-xs">
                {selectedStaff.yearsExperience} yrs exp
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Template */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              2
            </span>
            Select Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {templatesLoading ? (
              <p className="text-muted-foreground text-sm">Loading templates…</p>
            ) : (
              templates?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                    selectedTemplateId === template.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutTemplate
                      className={`w-5 h-5 ${selectedTemplateId === template.id ? 'text-accent' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="font-medium text-sm text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    {selectedTemplateId === template.id && (
                      <Badge className="ml-auto bg-accent/20 text-accent border-0 text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!selectedStaffId || !selectedTemplateId}
        onClick={handleGenerate}
      >
        <FileText className="w-5 h-5 mr-2" />
        {selectedStaff && selectedTemplate
          ? `Generate ${selectedTemplate.name} CV for ${selectedStaff.name}`
          : 'Generate CV'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Replace `apps/frontend/src/pages/templates/TemplatesPage.tsx`**

```tsx
import { LayoutTemplate } from 'lucide-react';
import { useTemplateList } from '@/hooks/useTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplateList();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">CV Templates</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Available templates for generating staff CVs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          : templates?.map((template) => (
              <Card
                key={template.id}
                className="shadow-card hover:shadow-elevated transition-shadow duration-200"
              >
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                    <LayoutTemplate className="w-5 h-5 text-accent" />
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {template.layoutKey} layout
                  </Badge>
                  {template.isActive && (
                    <Badge className="ml-2 bg-success/20 text-success border-0 text-xs">
                      Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/cv apps/frontend/src/pages/templates
git commit -m "feat(frontend): implement CV generator page and templates browser"
```

---

### Task 6: CV Template Components & Print Preview

**Files:**

- Create: `apps/frontend/src/components/cv-templates/ClassicTemplate.tsx`
- Create: `apps/frontend/src/components/cv-templates/ModernTemplate.tsx`
- Create: `apps/frontend/src/components/cv-templates/CompactTemplate.tsx`
- Modify: `apps/frontend/src/pages/cv/CVPreviewPage.tsx`

**Interfaces:**

- Consumes: `useCVData(staffId, templateId)` → `CVData`
- All templates receive `{ data: CVData }` prop and render a print-ready layout

- [ ] **Step 1: Create `apps/frontend/src/components/cv-templates/ClassicTemplate.tsx`**

```tsx
import type { CVData } from '@cv-generator/shared';
import { formatDate } from '@/lib/utils';

interface Props {
  data: CVData;
}

export function ClassicTemplate({ data }: Props) {
  const { staff, skills, participations } = data;

  return (
    <div className="cv-page bg-white text-gray-900 min-h-[297mm] w-[210mm] mx-auto font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="bg-slate-800 text-white p-8 flex gap-6 items-start">
        {staff.photoUrl && (
          <img
            src={staff.photoUrl}
            alt={staff.name}
            className="w-24 h-24 rounded-full object-cover border-2 border-white/30 shrink-0"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{staff.name}</h1>
          <p className="text-slate-300 mt-1 text-lg">{staff.jobTitle}</p>
          <p className="text-slate-400 text-sm mt-1">{staff.yearsExperience} years of experience</p>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-100 p-6 shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Skills
          </h2>
          <div className="space-y-1.5">
            {skills.map((skill) => (
              <div key={skill.id}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium text-gray-800">{skill.name}</span>
                  <span className="text-slate-500 capitalize">{skill.level}</span>
                </div>
                <div className="h-1 bg-slate-200 rounded-full">
                  <div
                    className="h-1 bg-slate-600 rounded-full"
                    style={{
                      width: {
                        beginner: '25%',
                        intermediate: '50%',
                        advanced: '75%',
                        expert: '100%',
                      }[skill.level],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6">
          <section className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
              Profile
            </h2>
            <p className="text-gray-700 leading-relaxed">{staff.summary}</p>
          </section>

          {participations.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Project Experience
              </h2>
              <div className="space-y-5">
                {participations.map((p) => (
                  <div key={p.id} className="border-l-2 border-slate-300 pl-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{p.project.name}</h3>
                        <p className="text-slate-600 text-xs">
                          {p.project.client} · {p.project.location}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(p.project.startDate)} — {formatDate(p.project.endDate)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">{p.role}</p>
                    <p className="text-xs text-gray-600 mt-1">{p.responsibilities}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(p.project.technologies as string[]).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/frontend/src/components/cv-templates/ModernTemplate.tsx`**

```tsx
import type { CVData } from '@cv-generator/shared';
import { formatDate } from '@/lib/utils';

interface Props {
  data: CVData;
}

export function ModernTemplate({ data }: Props) {
  const { staff, skills, participations } = data;

  const levelDot: Record<string, string> = {
    beginner: 'bg-gray-300',
    intermediate: 'bg-blue-400',
    advanced: 'bg-blue-600',
    expert: 'bg-blue-800',
  };

  return (
    <div className="cv-page bg-white text-gray-900 min-h-[297mm] w-[210mm] mx-auto font-sans text-sm leading-relaxed">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-10">
        <div className="flex items-center gap-6">
          {staff.photoUrl && (
            <img
              src={staff.photoUrl}
              alt={staff.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/40 shrink-0"
            />
          )}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">{staff.name}</h1>
            <p className="text-blue-100 text-lg mt-0.5">{staff.jobTitle}</p>
            <p className="text-blue-200 text-sm mt-0.5">{staff.yearsExperience} years experience</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-7">
        {/* Summary */}
        <section className="bg-blue-50 rounded-xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-2">About</h2>
          <p className="text-gray-700">{staff.summary}</p>
        </section>

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-3">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  <span className={`w-2 h-2 rounded-full ${levelDot[skill.level]}`} />
                  <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {participations.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 mb-4">
              Project Experience
            </h2>
            <div className="space-y-4">
              {participations.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-5">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{p.project.name}</h3>
                      <p className="text-sm text-gray-500">
                        {p.project.client} · {p.project.location}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {formatDate(p.project.startDate)} — {formatDate(p.project.endDate)}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-blue-700 mt-2 uppercase tracking-wide">
                    {p.role}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{p.responsibilities}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(p.project.technologies as string[]).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/frontend/src/components/cv-templates/CompactTemplate.tsx`**

```tsx
import type { CVData } from '@cv-generator/shared';
import { formatDate } from '@/lib/utils';

interface Props {
  data: CVData;
}

export function CompactTemplate({ data }: Props) {
  const { staff, skills, participations } = data;

  return (
    <div
      className="cv-page bg-white text-gray-900 min-h-[297mm] w-[210mm] mx-auto font-sans leading-snug"
      style={{ fontSize: '11px' }}
    >
      {/* Compact Header */}
      <div className="border-b-2 border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
          <p className="text-gray-600">
            {staff.jobTitle} · {staff.yearsExperience} years experience
          </p>
        </div>
        {staff.photoUrl && (
          <img
            src={staff.photoUrl}
            alt={staff.name}
            className="w-14 h-14 rounded object-cover border border-gray-300"
          />
        )}
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Summary */}
        <p className="text-gray-700 text-xs">{staff.summary}</p>

        {/* Skills inline */}
        {skills.length > 0 && (
          <div>
            <span className="font-bold text-gray-900 uppercase text-[9px] tracking-widest">
              Skills:{' '}
            </span>
            {skills.map((s, i) => (
              <span key={s.id}>
                {s.name}
                {i < skills.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Experience */}
        {participations.length > 0 && (
          <div>
            <h2 className="font-bold uppercase text-[9px] tracking-widest text-gray-900 border-b border-gray-200 pb-1 mb-2">
              Project Experience
            </h2>
            <div className="space-y-3">
              {participations.map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">{p.project.name}</span>
                    <span className="text-gray-500">
                      {formatDate(p.project.startDate)} — {formatDate(p.project.endDate)}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {p.project.client} · {p.project.location} ·{' '}
                    <span className="font-medium">{p.role}</span>
                  </p>
                  <p className="text-gray-700">{p.responsibilities}</p>
                  <p className="text-gray-500 text-[10px]">
                    {(p.project.technologies as string[]).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace `apps/frontend/src/pages/cv/CVPreviewPage.tsx`**

> **Fix 1 (P0) — `bundle-dynamic-imports`:** Templates are lazy-loaded so users only download the template they select, not all three. Each `React.lazy` import uses a statically analyzable string literal so Vite can split each template into its own chunk.
>
> **Fix 2 (P0) — `bundle-dynamic-imports` (@react-pdf/renderer):** `@react-pdf/renderer` is a heavy package (~500KB). It must only be loaded on-demand when the user clicks 'Generate PDF', **never** as part of the initial page load. If a PDF download button is added in future, use dynamic import gated behind the user action:
>
> ```tsx
> // Load PDF renderer only when user triggers PDF generation
> const handleGeneratePDF = async () => {
>   const { pdf } = await import('@react-pdf/renderer');
>   // ... use pdf()
> };
> ```
>
> Do NOT add `import ... from '@react-pdf/renderer'` as a static top-level import.
>
> **Fix 3 (P1) — `async-suspense-boundaries`:** CVPreviewPage is split into a **static shell** (toolbar renders immediately with zero data) and a **data-driven inner component** (`CVContent`) wrapped in `<Suspense>`. This means the Print and Back buttons are always visible — even while CV data is loading.
>
> **Component architecture:**
>
> ```tsx
> // CVPreviewPage renders the toolbar immediately
> export default function CVPreviewPage() {
>   return (
>     <div>
>       <CVToolbar /> {/* Static — renders with zero data */}
>       <Suspense fallback={<CVSkeleton />}>
>         <CVContent /> {/* Data-driven — suspends while loading */}
>       </Suspense>
>     </div>
>   );
> }
> ```

```tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Suspense, lazy } from 'react';
import type { CVData, LayoutKey } from '@cv-generator/shared';

// Fix 1 (P0): bundle-dynamic-imports
// Each template is lazy-loaded so only the selected template's code is downloaded.
// String literals are statically analyzable by Vite for chunk splitting.
const ClassicTemplate = lazy(() =>
  import('@/components/cv-templates/ClassicTemplate').then((m) => ({ default: m.ClassicTemplate })),
);
const ModernTemplate = lazy(() =>
  import('@/components/cv-templates/ModernTemplate').then((m) => ({ default: m.ModernTemplate })),
);
const CompactTemplate = lazy(() =>
  import('@/components/cv-templates/CompactTemplate').then((m) => ({ default: m.CompactTemplate })),
);

const templateComponents = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  compact: CompactTemplate,
} satisfies Record<LayoutKey, ReturnType<typeof lazy>>;

// Fix 2 (P0): @react-pdf/renderer must NEVER be imported statically.
// If a PDF download button is added, load it on-demand only:
//   const handleGeneratePDF = async () => {
//     const { pdf } = await import('@react-pdf/renderer');
//     // ... use pdf()
//   };

// Fix 3 (P1): async-suspense-boundaries
// CVContent is a separate component so the Suspense boundary only covers the data-driven area.
// The toolbar (Back + Print) renders immediately with zero data.
function CVContent({ staffId, templateId }: { staffId: string; templateId: string }) {
  // useSuspenseQuery integrates cleanly with the <Suspense> boundary above
  const { data, error } = useSuspenseQuery<CVData>({
    queryKey: ['cv', staffId, templateId],
    queryFn: () => api.get<CVData>(`/cv/${staffId}/${templateId}`).then((r) => r.data),
  });

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 gap-4">
        <p className="text-destructive">Failed to load CV data.</p>
        <Link to="/cv">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Generator
          </Button>
        </Link>
      </div>
    );
  }

  const TemplateComponent = templateComponents[data.template.layoutKey as LayoutKey];

  return (
    // Wrap template in Suspense so only the selected template chunk is awaited
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      <TemplateComponent data={data} />
    </Suspense>
  );
}

export default function CVPreviewPage() {
  const { staffId, templateId } = useParams<{ staffId: string; templateId: string }>();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Static shell: Print Toolbar renders IMMEDIATELY — no data needed */}
      <div className="no-print sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/cv">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Button onClick={() => window.print()} variant="accent" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      {/* Data-driven zone: suspends while CV data loads */}
      <div className="py-8 px-4 flex justify-center">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          }
        >
          <CVContent staffId={staffId!} templateId={templateId!} />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify full app end-to-end**

With both backend and frontend running:

1. Navigate to `http://localhost:5173/login` — should see the login page
2. Log in (create an admin user first via the backend seed or register endpoint)
3. Navigate to Staff → create a staff member
4. Add skills to the staff member
5. Navigate to Projects → create a project
6. Navigate to CV Generator → pick the staff member + a template → Generate CV
7. CV preview should render the appropriate template
8. Click "Print / Save PDF" to open the browser print dialog

- [ ] **Step 6: Final commit**

```bash
git add apps/frontend/src
git commit -m "feat(frontend): implement CV template components and print preview page"
```

---

## Plan 4 Complete ✅

**Deliverable:** Fully functional frontend with all CRUD pages, CV generator, and three print-ready CV templates (Classic, Modern, Compact). The system is end-to-end functional and ready for submission.

---

## Final README

After Plan 4 is complete, create `README.md` at the monorepo root:

```markdown
# GISCON CV Generator

Internal tool for generating professional staff CVs for technical proposal submissions.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

\`\`\`bash

# 1. Install dependencies

pnpm install

# 2. Set up environment variables

cp apps/backend/.env.example apps/backend/.env

# Edit apps/backend/.env with your PostgreSQL connection string and JWT secrets

cp apps/frontend/.env.example apps/frontend/.env

# 3. Run database migrations and seeds

pnpm --filter @cv-generator/backend migrate
pnpm --filter @cv-generator/backend seed

# 4. Start development servers

pnpm dev

# Frontend: http://localhost:5173

# Backend: http://localhost:3001

\`\`\`

## Key Design Decisions

1. **Monorepo with Turborepo + pnpm workspaces** — shared Zod schemas in `packages/shared` ensure validation is identical on frontend and backend. No duplicated types.
2. **Separate `users` and `staff` tables** — admin accounts need authentication credentials but don't appear in CVs. Separation keeps auth and domain concerns clean.
3. **Zod as single source of truth** — `packages/shared` exports schemas used by backend middleware validation AND frontend form validation via `@hookform/resolvers/zod`.
4. **Templates as React components** — CV templates are React components keyed by `layout_key` from the database. Full design freedom per template; easily extensible.
5. **JWT in-memory + httpOnly cookie** — access tokens are stored in JavaScript memory (not localStorage) to prevent XSS. Refresh tokens are httpOnly cookies to prevent JS access.
6. **Browser print for PDF export** — `@media print` CSS produces high-quality A4 PDFs without a server-side dependency (Puppeteer planned for v2).

## Assumptions

See [design spec](docs/superpowers/specs/2026-06-25-cv-generator-design.md) for full assumptions list.
\`\`\`
```

```bash
git add README.md
git commit -m "docs: add README with setup instructions and design decisions"
```
