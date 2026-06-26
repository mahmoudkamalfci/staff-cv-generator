import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Eye, Pencil, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useProjectList, useDeleteProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import type { Project } from '@cv-generator/shared';

export default function ProjectListPage() {
  const { data: projects, isLoading } = useProjectList();
  const { user } = useAuth();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const filtered = projects?.filter(
    (p: Project) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return;
    try {
      await deleteProject.mutateAsync(id);
      toast({ title: `"${name}" deleted` });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Error deleting project',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {projects?.length ?? 0} projects in the system
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button variant="accent" asChild>
            <Link to="/projects/new">
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or client…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search projects by name or client"
        />
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-5">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))
          : filtered?.map((project: Project) => (
              <Card
                key={project.id}
                className="shadow-card hover:shadow-elevated transition-shadow duration-200"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <Badge variant="outline">{project.client}</Badge>
                        {project.endDate === null && (
                          <Badge className="bg-success/20 text-success border-0 text-xs">
                            Ongoing
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(project.startDate)} — {formatDate(project.endDate)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(project.technologies as string[]).slice(0, 6).map((tech) => (
                          <span
                            key={tech}
                            className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                          >
                            {tech}
                          </span>
                        ))}
                        {(project.technologies as string[]).length > 6 && (
                          <span className="text-xs text-muted-foreground">
                            +{(project.technologies as string[]).length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View"
                        asChild
                        aria-label={`View details of project ${project.name}`}
                      >
                        <Link to={`/projects/${project.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      {user?.role === 'admin' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
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
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(project.id, project.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found.</p>
        </div>
      )}
    </div>
  );
}
