import { LayoutTemplate } from 'lucide-react';
import { useTemplateList } from '@/hooks/useTemplates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplateList();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">CV Templates</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Available templates for generating staff CVs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))
          : templates?.map((template) => (
              <Card
                key={template.id}
                className="shadow-card hover:shadow-elevated transition-shadow duration-200"
              >
                <CardHeader>
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-3">
                    <LayoutTemplate className="w-5 h-5 text-accent" />
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="capitalize">
                    {template.layoutKey} layout
                  </Badge>
                  {template.isActive && (
                    <Badge className="ml-2 bg-success/20 text-success border-0 text-xs">
                      Active
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
