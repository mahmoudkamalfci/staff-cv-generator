# Template Wizard Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the Template Wizard to remove custom sections and allow renaming of standard sections (except the Header).

**Architecture:** Modify the `Step2Sections` component to remove custom section adding/removing logic and replace the static label `<span>` with an editable `<Input>` for all sections where the `id` is not `'header'`.

**Tech Stack:** React, TypeScript, Tailwind CSS, shadcn/ui

## Global Constraints

- Remove Custom Sections functionality.
- Rename Standard Sections functionality.
- Header Exception: The "Header" section remains static.

---

### Task 1: Update Step2Sections Component

**Files:**
- Modify: `apps/frontend/src/pages/templates/wizard/Step2Sections.tsx`

**Interfaces:**
- Consumes: `sections` array and `onChange` callback from `Props`.
- Produces: Updated UI where standard section labels are editable, and custom section features are removed.

- [ ] **Step 1: Write the implementation for removing custom sections and adding editable titles**

```tsx
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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
    if (moved) {
      reordered.splice(result.destination.index, 0, moved);
      onChange(reordered.map((s, i) => ({ ...s, order: i })));
    }
  };

  const toggleVisible = (id: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)));
  };

  const updateLabel = (idx: number, label: string) => {
    const updated = sorted.map((s, i) => (i === idx ? { ...s, label } : s));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag sections to reorder them. Edit titles and toggle visibility.
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
                      style={drag.draggableProps.style as React.CSSProperties}
                      className={`rounded-lg border bg-card p-3 ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-accent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div {...drag.dragHandleProps} className="cursor-grab" aria-label="drag handle">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {section.id !== 'header' ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={section.label}
                              onChange={(e) => updateLabel(idx, e.target.value)}
                              className="h-7 text-sm"
                              placeholder="Section title"
                              aria-label="Section title"
                            />
                            <span className="text-xs text-muted-foreground capitalize whitespace-nowrap">
                              ({section.id})
                            </span>
                          </div>
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
                          aria-label={`Toggle visibility for ${section.label}`}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```

- [ ] **Step 2: Commit the changes**

```bash
git add apps/frontend/src/pages/templates/wizard/Step2Sections.tsx
git commit -m "feat: update template wizard sections to remove custom sections and make titles editable"
```
