# Plan 6: Frontend Template Builder Wizard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin-only Template Builder — an updated `TemplatesPage` with create/edit/delete actions, and a 4-step wizard (`TemplateWizardPage`) for creating and editing custom templates. Drag-and-drop section reordering. Live PDF preview in Step 4 using `<PDFViewer>` + `CVDocument`.

**Architecture:** `TemplateWizardPage` holds a single `draftConfig: TemplateConfig` state object updated as the user progresses through steps. Step 4 lazy-loads `CVDocument` and `PDFViewer`. The `useTemplates` hook is extended with mutation hooks for create/update/delete. All admin-only UI is gated by `useAuth().user.role === 'admin'`.

**Tech Stack:** React 18, TypeScript 5, `@hello-pangea/dnd` (drag-and-drop), `@tanstack/react-query` v5, `@react-pdf/renderer` (lazy-loaded Step 4 only), shadcn/ui, Tailwind v4

## Global Constraints

- All API calls go through `api` from `@/lib/api`
- `@react-pdf/renderer` must NOT be statically imported — only loaded dynamically inside Step 4
- `CVDocument` is lazy-loaded via `React.lazy` inside the wizard preview step
- `requireAdmin` check is handled UI-side only (backend also enforces it)
- `useAuth().user?.role === 'admin'` gates all create/edit/delete UI elements
- `TemplateConfig`, `CreateTemplateInput`, `UpdateTemplateInput` types from `@cv-generator/shared`
- Workspace root: `/home/mahmoud/frontend-projects/practise-projects/staff-cv-generator`

---

### Task 1: Install @hello-pangea/dnd

**Files:**

- Modify: `apps/frontend/package.json`

**Interfaces:**

- Produces: `@hello-pangea/dnd` available for drag-and-drop in the wizard

- [ ] **Step 1: Install the package**

```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator
pnpm --filter @cv-generator/frontend add @hello-pangea/dnd
pnpm --filter @cv-generator/frontend add -D @types/hello-pangea__dnd
```

Expected: Package appears in `apps/frontend/package.json`.

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/package.json pnpm-lock.yaml
git commit -m "feat(frontend): install @hello-pangea/dnd for wizard drag-and-drop"
```

---

### Task 2: Extended useTemplates Hook

**Files:**

- Modify: `apps/frontend/src/hooks/useTemplates.ts`

**Interfaces:**

- Consumes:
  - `api` from `@/lib/api`
  - `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/react-query`
  - `CVTemplate`, `CreateTemplateInput`, `UpdateTemplateInput` from `@cv-generator/shared`
- Produces:
  - `useTemplateList()` → `{ data: CVTemplate[], isLoading, error }` (existing, unchanged)
  - `useTemplateDetail(id: string)` → `{ data: CVTemplate | undefined, isLoading }`
  - `useCreateTemplate()` → mutation: `(input: CreateTemplateInput) => Promise<CVTemplate>`
  - `useUpdateTemplate()` → mutation: `({ id, input }: { id: string; input: UpdateTemplateInput }) => Promise<CVTemplate>`
  - `useDeleteTemplate()` → mutation: `(id: string) => Promise<void>`
  - `templateKeys` — query key factory

- [ ] **Step 1: Replace `apps/frontend/src/hooks/useTemplates.ts`**

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CVTemplate, CreateTemplateInput, UpdateTemplateInput } from '@cv-generator/shared';

export const templateKeys = {
  all: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
};

export function useTemplateList() {
  return useQuery({
    queryKey: templateKeys.all,
    queryFn: () => api.get<{ data: CVTemplate[] }>('/templates').then((r) => r.data.data),
  });
}

export function useTemplateDetail(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => api.get<{ data: CVTemplate }>(`/templates/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) =>
      api.post<{ data: CVTemplate }>('/templates', input).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTemplateInput }) =>
      api.patch<{ data: CVTemplate }>(`/templates/${id}`, input).then((r) => r.data.data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: templateKeys.all });
      qc.invalidateQueries({ queryKey: templateKeys.detail(id) });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`).then(() => undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter @cv-generator/frontend build 2>&1 | head -30
```

Expected: No errors referencing `useTemplates.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/hooks/useTemplates.ts
git commit -m "feat(frontend): extend useTemplates with CRUD mutation hooks"
```

---

### Task 3: Updated TemplatesPage — Admin Actions

**Files:**

- Modify: `apps/frontend/src/pages/templates/TemplatesPage.tsx`

**Interfaces:**

- Consumes:
  - `useTemplateList`, `useDeleteTemplate` from `@/hooks/useTemplates`
  - `useAuth` from `@/hooks/useAuth`
  - shadcn/ui: `Card`, `Badge`, `Button`, `AlertDialog` components
  - `useNavigate` from `react-router-dom`
- Produces:
  - Template list with "New Template" button (admin only)
  - Per-card "Edit" and "Delete" buttons (admin only)
  - Built-in templates show lock icon, edit/delete disabled with tooltip
  - Delete shows confirmation dialog

- [ ] **Step 1: Replace `apps/frontend/src/pages/templates/TemplatesPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useTemplateList, useDeleteTemplate } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CVTemplate } from '@cv-generator/shared';

function DeleteDialog({
  template,
  onConfirm,
  onCancel,
}: {
  template: CVTemplate;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{template.name}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplateList();
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteTemplate = useDeleteTemplate();
  const isAdmin = user?.role === 'admin';

  const [pendingDelete, setPendingDelete] = useState<CVTemplate | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTemplate.mutateAsync(pendingDelete.id);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete template. Please try again.');
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">CV Templates</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Available templates for generating staff CVs.
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => navigate('/templates/new')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
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
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                        <LayoutTemplate className="w-5 h-5 text-accent" />
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          {template.isBuiltIn ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button variant="ghost" size="icon" disabled className="h-7 w-7">
                                    <Lock className="w-3.5 h-3.5" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Built-in templates cannot be modified</TooltipContent>
                            </Tooltip>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => navigate(`/templates/${template.id}/edit`)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setPendingDelete(template)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize text-xs">
                        {(template.config as { baseLayout?: string })?.baseLayout?.replace(
                          '-',
                          ' ',
                        ) ?? 'custom'}{' '}
                        layout
                      </Badge>
                      {template.isBuiltIn && (
                        <Badge variant="outline" className="text-xs">
                          Built-in
                        </Badge>
                      )}
                      {template.isActive && (
                        <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {pendingDelete && (
          <DeleteDialog
            template={pendingDelete}
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Ensure the `/templates/new` and `/templates/:id/edit` routes are registered in the router**

Check `apps/frontend/src/App.tsx` (or wherever routes are defined). Add the routes:

```tsx
// Inside your <Routes> block:
<Route path="/templates/new" element={<TemplateWizardPage />} />
<Route path="/templates/:id/edit" element={<TemplateWizardPage />} />
```

Import `TemplateWizardPage` lazily:

```tsx
const TemplateWizardPage = lazy(() => import('./pages/templates/TemplateWizardPage'));
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/templates/TemplatesPage.tsx apps/frontend/src/App.tsx
git commit -m "feat(frontend): update TemplatesPage with admin CRUD actions"
```

---

### Task 4: TemplateWizardPage — Steps 1, 2, 3

**Files:**

- Create: `apps/frontend/src/pages/templates/TemplateWizardPage.tsx`
- Create: `apps/frontend/src/pages/templates/wizard/Step1Base.tsx`
- Create: `apps/frontend/src/pages/templates/wizard/Step2Sections.tsx`
- Create: `apps/frontend/src/pages/templates/wizard/Step3Colors.tsx`

**Interfaces:**

- Consumes:
  - `useTemplateDetail` from `@/hooks/useTemplates` (for edit mode pre-fill)
  - `useParams`, `useNavigate` from `react-router-dom`
  - `TemplateConfig`, `SectionConfig`, `CreateTemplateInput` from `@cv-generator/shared`
  - `DragDropContext`, `Droppable`, `Draggable` from `@hello-pangea/dnd`
- Produces:
  - `TemplateWizardPage` — default export, holds `draftConfig` state and step counter
  - `Step1Base` — base template picker + name/description fields
  - `Step2Sections` — drag-and-drop section list with visibility toggles
  - `Step3Colors` — color picker for primary + accent colors

- [ ] **Step 1: Create `apps/frontend/src/pages/templates/wizard/Step1Base.tsx`**

```tsx
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { TemplateConfig } from '@cv-generator/shared';

const BUILT_IN_PRESETS: Array<{
  name: string;
  baseLayout: TemplateConfig['baseLayout'];
  primaryColor: string;
  accentColor: string;
  preview: string;
}> = [
  {
    name: 'Classic',
    baseLayout: 'two-column',
    primaryColor: '#1e293b',
    accentColor: '#475569',
    preview: 'Two-column: sidebar skills + main content',
  },
  {
    name: 'Modern',
    baseLayout: 'one-column',
    primaryColor: '#1d4ed8',
    accentColor: '#3b82f6',
    preview: 'Single column, card-based sections',
  },
  {
    name: 'Compact',
    baseLayout: 'one-column',
    primaryColor: '#111827',
    accentColor: '#374151',
    preview: 'Single column, dense and minimal',
  },
];

const DEFAULT_SECTIONS: TemplateConfig['sections'] = [
  { id: 'header', label: 'Header', visible: true, order: 0 },
  { id: 'summary', label: 'Summary', visible: true, order: 1 },
  { id: 'skills', label: 'Skills', visible: true, order: 2 },
  { id: 'experience', label: 'Experience', visible: true, order: 3 },
];

interface Props {
  templateName: string;
  templateDescription: string;
  selectedBase: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSelectBase: (preset: (typeof BUILT_IN_PRESETS)[number]) => void;
  isEditing: boolean;
}

export function Step1Base({
  templateName,
  templateDescription,
  selectedBase,
  onNameChange,
  onDescriptionChange,
  onSelectBase,
  isEditing,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="template-name">Template Name *</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g. Executive Profile"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="template-description">Description</Label>
          <Textarea
            id="template-description"
            value={templateDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Short description of when to use this template"
            rows={2}
            className="mt-1"
          />
        </div>
      </div>

      {!isEditing && (
        <div>
          <Label className="mb-3 block">Start from a built-in layout</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BUILT_IN_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => onSelectBase(preset)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  selectedBase === preset.name
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-muted-foreground/40'
                }`}
              >
                <div
                  className="w-full h-2 rounded-full mb-3"
                  style={{ backgroundColor: preset.primaryColor }}
                />
                <p className="font-semibold text-sm text-foreground">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{preset.preview}</p>
                {selectedBase === preset.name && (
                  <Badge className="mt-2 bg-accent/20 text-accent border-0 text-xs">Selected</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_SECTIONS, BUILT_IN_PRESETS };
```

- [ ] **Step 2: Create `apps/frontend/src/pages/templates/wizard/Step2Sections.tsx`**

```tsx
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { SectionConfig } from '@cv-generator/shared';

interface Props {
  sections: SectionConfig[];
  onChange: (sections: SectionConfig[]) => void;
}

export function Step2Sections({ sections, onChange }: Props) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(sorted);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered.map((s, i) => ({ ...s, order: i })));
  };

  const toggleVisible = (id: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const updateLabel = (idx: number, label: string) => {
    const updated = sorted.map((s, i) => (i === idx ? { ...s, label } : s));
    onChange(updated);
  };

  const updateContent = (idx: number, content: string) => {
    const updated = sorted.map((s, i) => (i === idx ? { ...s, content } : s));
    onChange(updated);
  };

  const removeCustom = (idx: number) => {
    const updated = sorted.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i }));
    onChange(updated);
  };

  const addCustom = () => {
    if (sections.length >= 10) return;
    const newSection: SectionConfig = {
      id: 'custom',
      label: 'Custom Section',
      visible: true,
      order: sections.length,
      content: '',
    };
    onChange([...sections, newSection]);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag sections to reorder them. Toggle visibility and add custom text sections.
      </p>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {sorted.map((section, idx) => (
                <Draggable
                  key={`${section.id}-${section.order}`}
                  draggableId={`${section.id}-${section.order}`}
                  index={idx}
                  isDragDisabled={section.id === 'header'}
                >
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`rounded-lg border bg-card p-3 ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div {...drag.dragHandleProps} className="cursor-grab">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {section.id === 'custom' ? (
                          <Input
                            value={section.label}
                            onChange={(e) => updateLabel(idx, e.target.value)}
                            className="h-7 text-sm flex-1"
                            placeholder="Section title"
                          />
                        ) : (
                          <span className="flex-1 text-sm font-medium text-foreground">
                            {section.label}
                            <span className="ml-2 text-xs text-muted-foreground capitalize">
                              ({section.id})
                            </span>
                          </span>
                        )}

                        <Switch
                          checked={section.visible}
                          onCheckedChange={() => toggleVisible(section.id)}
                          disabled={section.id === 'header'}
                        />

                        {section.id === 'custom' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeCustom(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {section.id === 'custom' && section.visible && (
                        <div className="mt-2 pl-7">
                          <Label className="text-xs text-muted-foreground">Section content</Label>
                          <Textarea
                            value={section.content ?? ''}
                            onChange={(e) => updateContent(idx, e.target.value)}
                            placeholder="Enter static text content for this section (e.g. certifications, languages, etc.)"
                            rows={3}
                            className="mt-1 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        variant="outline"
        size="sm"
        onClick={addCustom}
        disabled={sections.length >= 10}
        className="w-full border-dashed"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add custom section
      </Button>
      {sections.length >= 10 && (
        <p className="text-xs text-muted-foreground text-center">Maximum of 10 sections reached</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `apps/frontend/src/pages/templates/wizard/Step3Colors.tsx`**

```tsx
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Props {
  primaryColor: string;
  accentColor: string;
  onPrimaryChange: (color: string) => void;
  onAccentChange: (color: string) => void;
}

export function Step3Colors({ primaryColor, accentColor, onPrimaryChange, onAccentChange }: Props) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Choose the primary color (used for the header background) and accent color (used for
        headings, highlights, and skill indicators).
      </p>

      <div className="space-y-6">
        {/* Primary Color */}
        <div className="space-y-3">
          <Label>Primary Color (Header background)</Label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="space-y-2 flex-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryChange(e.target.value)}
                className="w-full h-10 cursor-pointer rounded border"
              />
              <Input
                value={primaryColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onPrimaryChange(val);
                }}
                placeholder="#1e293b"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <Label>Accent Color (Section headings and highlights)</Label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm shrink-0"
              style={{ backgroundColor: accentColor }}
            />
            <div className="space-y-2 flex-1">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentChange(e.target.value)}
                className="w-full h-10 cursor-pointer rounded border"
              />
              <Input
                value={accentColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onAccentChange(val);
                }}
                placeholder="#3b82f6"
                className="font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Live preview swatch */}
        <div
          className="rounded-lg p-4 space-y-2"
          style={{ backgroundColor: primaryColor + '15', border: `2px solid ${accentColor}33` }}
        >
          <div
            className="h-8 rounded flex items-center px-3"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white text-sm font-semibold">Header Preview</span>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: accentColor }}
            >
              SECTION HEADING
            </span>
          </div>
          <div className="flex gap-2">
            {['React', 'TypeScript', 'Node.js'].map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: accentColor + '22', color: accentColor }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit steps 1, 2, 3**

```bash
git add apps/frontend/src/pages/templates/wizard/
git commit -m "feat(frontend): add wizard step components (base, sections, colors)"
```

---

### Task 5: TemplateWizardPage — Step 4 + Orchestrator

**Files:**

- Create: `apps/frontend/src/pages/templates/wizard/Step4Preview.tsx`
- Create: `apps/frontend/src/pages/templates/TemplateWizardPage.tsx`

**Interfaces:**

- Consumes:
  - `Step1Base`, `Step2Sections`, `Step3Colors` from previous task
  - `useCreateTemplate`, `useUpdateTemplate`, `useTemplateDetail` from `@/hooks/useTemplates`
  - `useStaffList` from `@/hooks/useStaff`
  - `CVDocument` via `React.lazy`
  - `PDFViewer` from `@react-pdf/renderer` via dynamic import
  - `TemplateConfig`, `SectionConfig` from `@cv-generator/shared`
- Produces:
  - `TemplateWizardPage` — 4-step wizard with shared `draftConfig` state
  - Step 4 renders `<PDFViewer>` with a sample staff member's data

- [ ] **Step 1: Create `apps/frontend/src/pages/templates/wizard/Step4Preview.tsx`**

```tsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useStaffList } from '@/hooks/useStaff';
import { api } from '@/lib/api';
import type { CVData, TemplateConfig } from '@cv-generator/shared';

// CVDocument is loaded only when this step is rendered
const CVDocument = lazy(() => import('@/components/cv-templates/CVDocument'));

// Fallback sample data — used if no staff members exist yet
const SAMPLE_DATA: CVData = {
  staff: {
    id: 'sample',
    name: 'Jane Doe',
    jobTitle: 'Senior Software Engineer',
    yearsExperience: 8,
    summary:
      'Experienced software engineer specialising in cloud architecture, distributed systems, and frontend development. Passionate about building scalable, maintainable products.',
    photoUrl: null,
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  skills: [
    { id: '1', staffId: 'sample', name: 'React', level: 'expert' },
    { id: '2', staffId: 'sample', name: 'TypeScript', level: 'advanced' },
    { id: '3', staffId: 'sample', name: 'Node.js', level: 'advanced' },
    { id: '4', staffId: 'sample', name: 'PostgreSQL', level: 'intermediate' },
    { id: '5', staffId: 'sample', name: 'Docker', level: 'intermediate' },
  ],
  participations: [
    {
      id: '1',
      staffId: 'sample',
      projectId: 'p1',
      role: 'Lead Frontend Engineer',
      responsibilities:
        'Led the migration from a legacy monolith to a React microfrontend architecture. Defined component standards and improved page load times by 40%.',
      project: {
        id: 'p1',
        name: 'E-Commerce Platform Relaunch',
        description: 'Full relaunch of core platform',
        client: 'RetailCorp GmbH',
        location: 'Berlin, Germany',
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T00:00:00Z',
        technologies: ['React', 'TypeScript', 'GraphQL', 'AWS'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ],
  template: {
    id: 'preview',
    name: 'Preview',
    layoutKey: 'preview',
    description: '',
    isActive: true,
    isBuiltIn: false,
    config: {} as TemplateConfig, // overridden by prop
    createdAt: new Date().toISOString(),
  },
  generatedAt: new Date().toISOString(),
};

interface Props {
  config: TemplateConfig;
}

export function Step4Preview({ config }: Props) {
  const { data: staffList } = useStaffList();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<
    React.PropsWithChildren<{
      width: string;
      height: string;
      style?: React.CSSProperties;
    }>
  > | null>(null);

  // Load first real staff member for preview; fall back to sample data
  useEffect(() => {
    const firstStaff = staffList?.[0];
    if (!firstStaff) {
      setCvData({ ...SAMPLE_DATA, template: { ...SAMPLE_DATA.template, config } });
      return;
    }
    api
      .get<{ data: CVData }>(`/cv/${firstStaff.id}/preview-dummy`)
      .then((r) => setCvData({ ...r.data.data, template: { ...r.data.data.template, config } }))
      .catch(() => {
        // If the API call fails (e.g. no template yet), use sample data
        setCvData({ ...SAMPLE_DATA, template: { ...SAMPLE_DATA.template, config } });
      });
  }, [staffList, config]);

  // Lazy-load PDFViewer
  useEffect(() => {
    import('@react-pdf/renderer').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPDFViewer(() => (mod as any).PDFViewer);
    });
  }, []);

  if (!cvData || !PDFViewer) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-sm text-muted-foreground">Loading preview…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This is exactly how the generated PDF will look.
        {!staffList?.[0] && (
          <span className="text-yellow-600 ml-1">
            (Showing sample data — add a staff member to preview with real data.)
          </span>
        )}
      </p>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        }
      >
        <PDFViewer
          width="100%"
          height="700px"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
        >
          <CVDocument data={cvData} config={config} />
        </PDFViewer>
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/frontend/src/pages/templates/TemplateWizardPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateTemplate, useUpdateTemplate, useTemplateDetail } from '@/hooks/useTemplates';
import { Step1Base, DEFAULT_SECTIONS, BUILT_IN_PRESETS } from './wizard/Step1Base';
import { Step2Sections } from './wizard/Step2Sections';
import { Step3Colors } from './wizard/Step3Colors';
import { Step4Preview } from './wizard/Step4Preview';
import type { TemplateConfig, SectionConfig } from '@cv-generator/shared';

const STEPS = [
  { number: 1, title: 'Base Template', description: 'Choose starting layout and name' },
  { number: 2, title: 'Sections', description: 'Reorder and configure sections' },
  { number: 3, title: 'Colors', description: 'Set primary and accent colors' },
  { number: 4, title: 'Preview', description: 'Review and save your template' },
];

export default function TemplateWizardPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: existingTemplate } = useTemplateDetail(id ?? '');
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const [step, setStep] = useState(1);
  const [templateName, setTemplateName] = useState(existingTemplate?.name ?? '');
  const [templateDescription, setTemplateDescription] = useState(
    existingTemplate?.description ?? '',
  );
  const [selectedBase, setSelectedBase] = useState('Classic');
  const [draftConfig, setDraftConfig] = useState<TemplateConfig>(
    (existingTemplate?.config as TemplateConfig | undefined) ?? {
      baseLayout: 'two-column',
      primaryColor: '#1e293b',
      accentColor: '#475569',
      sections: DEFAULT_SECTIONS,
    },
  );

  // Sync from fetched template when editing (async load)
  if (isEditing && existingTemplate && !templateName) {
    setTemplateName(existingTemplate.name);
    setTemplateDescription(existingTemplate.description);
    setDraftConfig(existingTemplate.config as TemplateConfig);
  }

  const handleSelectBase = (preset: (typeof BUILT_IN_PRESETS)[number]) => {
    setSelectedBase(preset.name);
    setDraftConfig({
      baseLayout: preset.baseLayout,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      sections: DEFAULT_SECTIONS,
    });
  };

  const updateSections = (sections: SectionConfig[]) => {
    setDraftConfig((prev) => ({ ...prev, sections }));
  };

  const canAdvance = (): boolean => {
    if (step === 1) return templateName.trim().length > 0;
    if (step === 2) return draftConfig.sections.some((s) => s.id === 'header' && s.visible);
    return true;
  };

  const handleSave = async () => {
    try {
      if (isEditing && id) {
        await updateTemplate.mutateAsync({
          id,
          input: { name: templateName, description: templateDescription, config: draftConfig },
        });
      } else {
        await createTemplate.mutateAsync({
          name: templateName,
          description: templateDescription,
          config: draftConfig,
        });
      }
      navigate('/templates');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save template. Please try again.');
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Template' : 'New Template'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Step {step} of {STEPS.length} — {STEPS[step - 1].title}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
          Cancel
        </Button>
      </div>

      {/* Step progress */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.number}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              s.number <= step ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">{STEPS[step - 1].title}</CardTitle>
          <CardDescription>{STEPS[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Step1Base
              templateName={templateName}
              templateDescription={templateDescription}
              selectedBase={selectedBase}
              onNameChange={setTemplateName}
              onDescriptionChange={setTemplateDescription}
              onSelectBase={handleSelectBase}
              isEditing={isEditing}
            />
          )}
          {step === 2 && (
            <Step2Sections sections={draftConfig.sections} onChange={updateSections} />
          )}
          {step === 3 && (
            <Step3Colors
              primaryColor={draftConfig.primaryColor}
              accentColor={draftConfig.accentColor}
              onPrimaryChange={(c) => setDraftConfig((p) => ({ ...p, primaryColor: c }))}
              onAccentChange={(c) => setDraftConfig((p) => ({ ...p, accentColor: c }))}
            />
          )}
          {step === 4 && <Step4Preview config={draftConfig} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Template'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/templates/wizard/Step4Preview.tsx \
        apps/frontend/src/pages/templates/TemplateWizardPage.tsx
git commit -m "feat(frontend): add TemplateWizardPage 4-step template builder"
```

---

### Task 6: End-to-End Verification

**Files:** No new files — verification only.

- [ ] **Step 1: Start both services and navigate to `/templates`**

```bash
pnpm dev
```

Navigate to `http://localhost:5173/templates`:

- 3 built-in template cards visible (Classic, Modern, Compact)
- Each card shows the layout badge and "Built-in" badge
- Admin user sees lock icon on each card (not edit/delete buttons)
- Admin user sees "New Template" button in top right

- [ ] **Step 2: Create a custom template**

1. Click "New Template"
2. Step 1: Enter name "Executive Dark", select "Modern" as base
3. Step 2: Toggle "Summary" section off, drag "Experience" above "Skills"
4. Step 3: Set primary to `#0f172a`, accent to `#6366f1`
5. Step 4: Verify the PDF preview renders with the correct colors and section order
6. Click "Save Template"
7. Verify redirect to `/templates` and new card appears

- [ ] **Step 3: Edit the custom template**

1. Click the "Edit" (pencil) icon on the custom template card
2. Wizard opens pre-filled with the saved config
3. Change the accent color to `#f59e0b`
4. Click "Save Changes"
5. Verify the card updates

- [ ] **Step 4: Delete the custom template**

1. Click the "Delete" (trash) icon on the custom template
2. Confirmation dialog appears
3. Click "Delete"
4. Card disappears from the list

- [ ] **Step 5: Verify built-in protection**

1. Attempt to edit a built-in template (should be impossible — no edit button, only lock icon)
2. Confirm the lock tooltip says "Built-in templates cannot be modified"

- [ ] **Step 6: Final commit**

```bash
git commit --allow-empty -m "chore(frontend): verify template wizard end-to-end"
```

---

## Plan 6 Complete ✅

**Deliverable:** Admin-ready template management system — updated `TemplatesPage` with create/edit/delete actions, 4-step `TemplateWizardPage` with drag-and-drop section reordering and live PDF preview, full `useTemplates` CRUD hooks, and protection against modifying built-in templates.
