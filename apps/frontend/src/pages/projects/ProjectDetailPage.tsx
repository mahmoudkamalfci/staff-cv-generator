import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Loader2, Calendar, MapPin, Building2, Users } from 'lucide-react';
import { useProjectDetail } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading } = useProjectDetail(id!);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (!project) return <p className="text-muted-foreground">Project not found.</p>;

  const p = project as typeof project & {
    participations?: Array<{
      id: string;
      staffId: string;
      role: string;
      responsibilities: string;
      staffName?: string;
      staffJobTitle?: string;
    }>;
  };

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
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Link>
          </Button>
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{project.name}</h2>
              {project.endDate === null && (
                <Badge className="bg-success/20 text-success border-0 mt-1">Ongoing</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4" /> {project.client}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" /> {project.location}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" /> {formatDate(project.startDate)} —{' '}
              {formatDate(project.endDate)}
            </div>
          </div>
          <Separator />
          <p className="text-foreground leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {(project.technologies as string[]).map((tech) => (
              <span
                key={tech}
                className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {p.participations && p.participations.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4" /> Assigned Staff ({p.participations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {p.participations.map((part) => (
              <div key={part.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      to={`/staff/${part.staffId}`}
                      className="font-medium text-foreground hover:text-accent transition-colors"
                    >
                      {part.staffName ?? 'Staff Member'}
                    </Link>
                    <p className="text-sm text-muted-foreground">{part.staffJobTitle}</p>
                  </div>
                  <Badge variant="secondary">{part.role}</Badge>
                </div>
                <p className="text-sm text-foreground mt-2">{part.responsibilities}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
