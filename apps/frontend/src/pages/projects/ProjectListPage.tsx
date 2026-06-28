import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Eye, Pencil, Calendar } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
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
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);



  const { data: response, isLoading } = useProjectList(page, debouncedSearch);
  const projects = response?.data;
  const pagination = response?.pagination;

  const { user } = useAuth();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();

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
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination?.total ?? 0} projects in the system
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
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Search projects by name or client"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-none border border-border bg-card">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="flex justify-end pt-2 border-t border-border/40">
                    <Skeleton className="h-9 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          : projects?.map((project: Project) => (
              <Card
                key={project.id}
                className="shadow-none border border-border bg-card hover:bg-muted/30 transition-colors duration-150 flex flex-col justify-between"
              >
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground leading-snug break-words flex-1 pr-1">{project.name}</h3>
                        {project.endDate === null && (
                          <Badge className="bg-success text-success-foreground border-0 text-[10px] font-semibold py-0.5 px-1.5 shrink-0">
                            Ongoing
                          </Badge>
                        )}
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
                      {(project.technologies as string[]).length > 4 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{(project.technologies as string[]).length - 4} more
                        </span>
                      )}
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
                    {user?.role === 'admin' && (
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
                          onClick={() => handleDelete(project.id, project.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!isLoading && projects?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found.</p>
        </div>
      )}

      {pagination && pagination.total > pagination.limit && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * pagination.limit >= pagination.total}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
