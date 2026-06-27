import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Eye, Pencil } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useStaffList, useDeleteStaff } from '@/hooks/useStaff';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import type { Staff } from '@cv-generator/shared';

export default function StaffListPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: response, isLoading } = useStaffList(page, debouncedSearch);
  const staff = response?.data;
  const pagination = response?.pagination;

  const { user } = useAuth();
  const deleteStaff = useDeleteStaff();
  const { toast } = useToast();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the system?`)) return;
    try {
      await deleteStaff.mutateAsync(id);
      toast({ title: `${name} removed` });
    } catch (err) {
      console.error('Failed to delete staff member:', err);
      toast({
        title: 'Delete failed',
        description: 'An error occurred while deleting the staff member.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Members</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination?.total ?? 0} members in the system
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button variant="accent" asChild>
            <Link to="/staff/new">
              <Plus className="w-4 h-4 mr-2" /> Add Staff
            </Link>
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or job title…"
          aria-label="Search staff members by name or job title"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="shadow-none border border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : staff?.map((member: Staff) => (
              <Card
                key={member.id}
                className="shadow-none border border-border bg-card hover:bg-muted/30 transition-colors duration-150"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.photoUrl ?? undefined} alt={member.name} />
                      <AvatarFallback className="bg-secondary text-primary font-bold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.jobTitle}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {member.yearsExperience} yr{member.yearsExperience !== 1 ? 's' : ''} exp
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View profile"
                      aria-label={`View profile of ${member.name}`}
                      className="h-10 w-10"
                      asChild
                    >
                      <Link to={`/staff/${member.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    {user?.role === 'admin' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          aria-label={`Edit profile of ${member.name}`}
                          className="h-10 w-10"
                          asChild
                        >
                          <Link to={`/staff/${member.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          aria-label={`Delete ${member.name}`}
                          className="text-destructive hover:bg-destructive/10 h-10 w-10"
                          onClick={() => handleDelete(member.id, member.name)}
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

      {!isLoading && staff?.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No staff members found.</p>
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
