import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText, Loader2 } from 'lucide-react';
import { useStaffDetail } from '@/hooks/useStaff';
import { useAuth } from '@/hooks/useAuth';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: staff, isLoading } = useStaffDetail(id!);
  const { data: templates } = useTemplateList();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!staff) return <p className="text-muted-foreground text-center py-12">Staff member not found.</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back + Edit Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="h-10 px-4">
          <Link to="/staff">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Staff
          </Link>
        </Button>
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" asChild className="h-10 px-4">
            <Link to={`/staff/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </Link>
          </Button>
        )}
      </div>

      {/* Unified Profile Sheet */}
      <Card className="shadow-none border border-border bg-card divide-y divide-border">
        {/* Section 1: Profile Header */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="w-20 h-20 shrink-0">
              <AvatarImage src={staff.photoUrl ?? undefined} alt={staff.name} />
              <AvatarFallback className="bg-secondary text-primary text-xl font-bold">
                {getInitials(staff.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{staff.name}</h1>
                  <p className="text-muted-foreground mt-0.5">{staff.jobTitle}</p>
                </div>
                <Badge variant="secondary" className="self-start sm:self-center px-3 py-1 font-medium bg-muted text-muted-foreground border-0">
                  {staff.yearsExperience} year{staff.yearsExperience !== 1 ? 's' : ''} experience
                </Badge>
              </div>
              {staff.summary && (
                <p className="text-sm text-foreground leading-relaxed mt-4 bg-muted/20 p-4 rounded border border-border/30">
                  {staff.summary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Skills */}
        {staff.skills && staff.skills.length > 0 && (
          <div className="p-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {staff.skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="px-3 py-1 bg-secondary text-primary border border-border font-medium">
                  {skill.name} <span className="opacity-60 ml-2">({skill.level})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Previous Projects */}
        {staff.participations && staff.participations.length > 0 && (
          <div className="p-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Previous Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.participations.map((p) => (
                <div key={p.id} className="p-4 border border-border bg-card/50 rounded-lg flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base">
                      {p.project ? (
                        <Link to={`/projects/${p.projectId}`} className="text-primary hover:underline hover:text-accent">
                          {p.project.name}
                        </Link>
                      ) : (
                        'Unknown Project'
                      )}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground mt-1">Role: {p.role}</p>
                    {p.responsibilities && (
                      <p className="text-sm mt-3 text-foreground/90 leading-relaxed">{p.responsibilities}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Generate CV */}
        <div className="p-6 bg-muted/10">
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generate CV Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {templates?.map((t) => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-between border-border hover:bg-muted/40 hover:text-accent group transition-colors shadow-none text-left flex items-center"
                  onClick={() => navigate(`/cv/preview/${id}/${t.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-accent">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.description || 'Standard tender layout'}</p>
                  </div>
                  <FileText className="w-4 h-4 text-muted-foreground group-hover:text-accent ml-2 shrink-0" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
