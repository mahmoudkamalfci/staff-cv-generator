import { LayoutTemplate, Pencil, Trash2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CVTemplate } from '@cv-generator/shared';

export interface TemplateCardProps {
  template: CVTemplate;
  isAdmin: boolean;
  onEdit: (id: string) => void;
  onDelete: (template: CVTemplate) => void;
}

export function TemplateCard({ template, isAdmin, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card className="shadow-none border border-border bg-card hover:bg-muted/30 transition-colors duration-150">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
            <LayoutTemplate className="w-5 h-5 text-accent" />
          </div>
          {isAdmin ? (
            <div className="flex gap-1">
              {template.isBuiltIn ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled
                        className="h-10 w-10"
                        aria-label={`Built-in template ${template.name} is locked`}
                      >
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
                    className="h-10 w-10"
                    onClick={() => onEdit(template.id)}
                    aria-label={`Edit template ${template.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive hover:text-destructive"
                    onClick={() => onDelete(template)}
                    aria-label={`Delete template ${template.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ) : null}
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
          {template.isBuiltIn ? (
            <Badge variant="outline" className="text-xs">
              Built-in
            </Badge>
          ) : null}
          {template.isActive ? (
            <Badge className="bg-success text-success-foreground border-0 text-xs font-semibold">
              Active
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
