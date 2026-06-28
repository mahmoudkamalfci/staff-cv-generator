import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Project } from '@cv-generator/shared';

export interface ProjectCardProps {
  project: Project;
  isAdmin: boolean;
  onDelete: (id: string, name: string) => void;
}

export function ProjectCard({ project, isAdmin, onDelete }: ProjectCardProps) {
  return (
    <Card className="shadow-none border border-border bg-card hover:bg-muted/30 transition-colors duration-150 flex flex-col justify-between">
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground leading-snug break-words flex-1 pr-1">{project.name}</h3>
              {project.endDate === null ? (
                <Badge className="bg-success text-success-foreground border-0 text-[10px] font-semibold py-0.5 px-1.5 shrink-0">
                  Ongoing
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px] py-0 px-1.5">
                {project.client}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(project.startDate)} — {formatDate(project.endDate)}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {(project.technologies as string[]).slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[10px] bg-secondary text-primary border border-border px-1.5 py-0.5 rounded-full font-medium"
              >
                {tech}
              </span>
            ))}
            {(project.technologies as string[]).length > 4 ? (
              <span className="text-[10px] text-muted-foreground self-center">
                +{(project.technologies as string[]).length - 4} more
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2 mt-5 justify-end border-t border-border/40 pt-3">
          <Button
            variant="ghost"
            size="icon"
            title="View"
            className="h-10 w-10"
            asChild
            aria-label={`View details of project ${project.name}`}
          >
            <Link to={`/projects/${project.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          {isAdmin ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                className="h-10 w-10"
                asChild
                aria-label={`Edit project ${project.name}`}
              >
                <Link to={`/projects/${project.id}/edit`}>
                  <Pencil className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete"
                aria-label={`Delete project ${project.name}`}
                className="text-destructive hover:bg-destructive/10 h-10 w-10"
                onClick={() => onDelete(project.id, project.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
