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
          <Label htmlFor="primary-color-text">Primary Color (Header background)</Label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
              aria-hidden="true"
            />
            <div className="space-y-2 flex-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => onPrimaryChange(e.target.value)}
                className="w-full h-10 cursor-pointer rounded border"
                aria-label="Primary color color picker"
              />
              <Input
                id="primary-color-text"
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
          <Label htmlFor="accent-color-text">Accent Color (Section headings and highlights)</Label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border shadow-sm shrink-0"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <div className="space-y-2 flex-1">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentChange(e.target.value)}
                className="w-full h-10 cursor-pointer rounded border"
                aria-label="Accent color color picker"
              />
              <Input
                id="accent-color-text"
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
          className="rounded-lg p-4 space-y-2 shadow-sm border"
          style={{ backgroundColor: primaryColor + '15', borderColor: `${accentColor}33` }}
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
