import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { useTemplateList, useDeleteTemplate } from '@/hooks/useTemplates';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import type { CVTemplate } from '@cv-generator/shared';
import { TemplateCard } from '@/components/cv-templates/TemplateCard';

function DeleteDialog({
  template,
  onConfirm,
  onCancel,
}: {
  template: CVTemplate;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{template.name}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplateList();
  const { user } = useAuth();
  const navigate = useNavigate();
  const deleteTemplate = useDeleteTemplate();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [pendingDelete, setPendingDelete] = useState<CVTemplate | null>(null);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTemplate.mutateAsync(pendingDelete.id);
      toast({
        title: 'Template deleted',
        description: `"${pendingDelete.name}" has been removed.`,
      });
    } catch (err) {
      console.error('Delete failed:', err);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CV Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Available templates for generating staff CVs.
            </p>
          </div>
          {isAdmin ? (
            <Button onClick={() => navigate('/templates/new')} className="h-10 px-4">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="shadow-none border border-border bg-card">
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))
            : templates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isAdmin={isAdmin}
                onEdit={(id) => navigate(`/templates/${id}/edit`)}
                onDelete={(t) => setPendingDelete(t)}
              />
            ))}
        </div>

        {pendingDelete ? (
          <DeleteDialog
            template={pendingDelete}
            onConfirm={handleDelete}
            onCancel={() => setPendingDelete(null)}
          />
        ) : null}
      </div>
    </TooltipProvider>
  );
}
