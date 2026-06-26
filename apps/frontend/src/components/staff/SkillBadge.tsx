import { X } from 'lucide-react';
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
