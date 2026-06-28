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
import { ProjectCard } from '@/components/projects/ProjectCard';

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
        {user?.role === 'admin' ? (
          <Button variant="accent" asChild>
            <Link to="/projects/new">
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </Link>
          </Button>
        ) : null}
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
              <ProjectCard
                key={project.id}
                project={project}
                isAdmin={user?.role === 'admin'}
                onDelete={handleDelete}
              />
            ))}
      </div>

      {!isLoading && projects?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No projects found.</p>
        </div>
      ) : null}

      {pagination && pagination.total > pagination.limit ? (
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
      ) : null}
    </div>
  );
}
