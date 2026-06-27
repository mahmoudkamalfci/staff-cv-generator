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

  const updateLabel = (id: string, label: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, label } : s)));
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
                              onChange={(e) => updateLabel(section.id, e.target.value)}
                              maxLength={60}
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
