import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2, Calendar, MapPin, Building2, Users } from 'lucide-react';
import { useProjectDetail } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
import type { Participation } from '@cv-generator/shared';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading } = useProjectDetail(id!);

  if (isLoading)
    return (
      <div
        className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent" aria-hidden="true" />
        <span className="text-sm font-medium">Loading project details...</span>
      </div>
    );

  if (!project)
    return (
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
            </Link>
          </Button>
        </div>
        <Card className="shadow-none border border-border bg-card">
          <CardContent className="p-12 text-center space-y-4">
            <div className="text-destructive font-semibold text-lg">Project not found</div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              The project you are looking for does not exist, or you do not have permission to view
              it.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/projects">Return to projects list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Link>
        </Button>
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/projects/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Project
            </Link>
          </Button>
        )}
      </div>

      <Card className="shadow-none border border-border bg-card">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
                {project.name}
              </h1>
              {project.endDate === null && (
                <Badge className="bg-success text-success-foreground border-0 text-[10px] font-semibold py-0.5 px-1.5 shrink-0 select-none mt-1">
                  Ongoing
                </Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{project.client}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {formatDate(project.startDate)} — {formatDate(project.endDate)}
              </span>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Technologies
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(project.technologies as string[]).map((tech) => (
                <span
                  key={tech}
                  className="text-xs bg-secondary text-primary border border-border px-2.5 py-1 rounded-full font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="w-4 h-4 text-primary" /> Assigned Staff{' '}
            {project.participations &&
              project.participations.length > 0 &&
              `(${project.participations.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!project.participations || project.participations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-muted-foreground/45" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No staff members assigned</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                No team members are currently linked to this project. Edit the project to assign
                staff.
              </p>
              {user?.role === 'admin' && (
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <Link to={`/projects/${id}/edit`}>Assign Staff</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {project.participations.map((part: Participation) => (
                <div
                  key={part.id}
                  className="border border-border rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/staff/${part.staffId}`}
                        className="font-medium text-foreground hover:text-accent focus-visible:text-accent focus-visible:underline outline-none transition-colors"
                      >
                        {part.staff?.name ?? 'Staff Member'}
                      </Link>
                      <p className="text-sm text-muted-foreground">{part.staff?.jobTitle}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {part.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                    {part.responsibilities}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
