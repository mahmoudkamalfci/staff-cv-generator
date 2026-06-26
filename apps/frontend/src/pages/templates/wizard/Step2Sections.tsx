import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      order: sorted.length, // use sorted.length to match next index
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
                        <div {...drag.dragHandleProps} className="cursor-grab" aria-label="drag handle">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {section.id === 'custom' ? (
                          <Input
                            value={section.label}
                            onChange={(e) => updateLabel(idx, e.target.value)}
                            className="h-7 text-sm flex-1"
                            placeholder="Section title"
                            aria-label="Section title"
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
                          aria-label={`Toggle visibility for ${section.label}`}
                        />

                        {section.id === 'custom' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeCustom(idx)}
                            aria-label={`Remove custom section ${section.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {section.id === 'custom' && section.visible && (
                        <div className="mt-2 pl-7">
                          <Label htmlFor={`content-${idx}`} className="text-xs text-muted-foreground">Section content</Label>
                          <textarea
                            id={`content-${idx}`}
                            value={section.content ?? ''}
                            onChange={(e) => updateContent(idx, e.target.value)}
                            placeholder="Enter static text content for this section (e.g. certifications, languages, etc.)"
                            rows={3}
                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none mt-1"
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
