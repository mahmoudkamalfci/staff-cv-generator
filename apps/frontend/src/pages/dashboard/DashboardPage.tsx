import { Users, FolderKanban, LayoutTemplate, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStaffList } from '@/hooks/useStaff';
import { useProjectList } from '@/hooks/useProjects';
import { useTemplateList } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StatRowProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  iconColor: string;
  to: string;
  isLoading: boolean;
}

function StatRow({ title, value, icon: Icon, iconColor, to, isLoading }: StatRowProps) {
  return (
    <div className="flex items-center justify-between p-6 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">Manage and view registration details</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {isLoading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <span className="text-2xl font-bold text-foreground font-mono">{value ?? 0}</span>
        )}
        <Button asChild variant="outline" size="sm" className="h-9 px-4 hidden sm:inline-flex">
          <Link to={to}>View Registry</Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 sm:hidden">
          <Link to={to} aria-label={`View ${title}`}>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
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
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's in your CV generator today.</p>
      </div>

      {/* Stats List Ledger */}
      <Card className="shadow-none border border-border bg-card divide-y divide-border">
        <StatRow
          title="Staff Members"
          value={staff?.length}
          icon={Users}
          iconColor="bg-accent/15 text-accent"
          to="/staff"
          isLoading={staffLoading}
        />
        <StatRow
          title="Projects"
          value={projects?.length}
          icon={FolderKanban}
          iconColor="bg-primary/15 text-primary"
          to="/projects"
          isLoading={projectsLoading}
        />
        <StatRow
          title="CV Templates"
          value={templates?.length}
          icon={LayoutTemplate}
          iconColor="bg-secondary text-secondary-foreground border border-border/20"
          to="/templates"
          isLoading={templatesLoading}
        />
      </Card>

      {/* Quick Action */}
      <Card className="shadow-none border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FileText className="w-5 h-5 text-accent" />
            Generate a CV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Select a staff member and a template to generate a professional CV for your next
            proposal.
          </p>
          <Button asChild variant="accent" size="lg" className="h-11">
            <Link to="/cv">Open CV Generator</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
