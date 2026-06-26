import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
          <textarea
            id="template-description"
            value={templateDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Short description of when to use this template"
            rows={2}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none mt-1"
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
