import { Users, FolderKanban, LayoutTemplate, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaffList } from '@/hooks/useStaff';
import { useProjectList } from '@/hooks/useProjects';
import { useTemplateList } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  to: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon: Icon, color, to, isLoading }: StatCardProps) {
  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value ?? 0}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mt-4 text-xs text-muted-foreground hover:text-foreground px-0"
        >
          <Link to={to}>View all →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: projects, isLoading: projectsLoading } = useProjectList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="text-muted-foreground mt-1">Here's what's in your CV generator today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Staff Members"
          value={staff?.length}
          icon={Users}
          color="bg-accent/15 text-accent"
          to="/staff"
          isLoading={staffLoading}
        />
        <StatCard
          title="Projects"
          value={projects?.length}
          icon={FolderKanban}
          color="bg-primary/15 text-primary"
          to="/projects"
          isLoading={projectsLoading}
        />
        <StatCard
          title="CV Templates"
          value={templates?.length}
          icon={LayoutTemplate}
          color="bg-success/15 text-success"
          to="/templates"
          isLoading={templatesLoading}
        />
      </div>

      {/* Quick Action */}
      <Card className="shadow-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-accent" />
            Generate a CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Select a staff member and a template to generate a professional CV for your next
            proposal.
          </p>
          <Button asChild variant="accent">
            <Link to="/cv">Open CV Generator</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
