import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, X, Plus } from 'lucide-react';
import { CreateProjectSchema, type CreateProjectInput } from '@cv-generator/shared';
import { useProjectDetail, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: existing, isLoading } = useProjectDetail(id ?? '');
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(id ?? '');

  const [techInput, setTechInput] = useState('');

  const existingTechs = (existing?.technologies as string[] | undefined) ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    values: existing
      ? {
          name: existing.name,
          description: existing.description,
          client: existing.client,
          location: existing.location,
          startDate: String(existing.startDate),
          endDate: existing.endDate ? String(existing.endDate) : null,
          technologies: existingTechs,
        }
      : {
          name: '',
          description: '',
          client: '',
          location: '',
          startDate: '',
          endDate: null,
          technologies: [],
        },
  });

  const technologies = watch('technologies') || [];

  const addTech = () => {
    const t = techInput.trim();
    if (t && !technologies.includes(t)) {
      setValue('technologies', [...technologies, t], { shouldValidate: true });
    }
    setTechInput('');
  };

  const removeTech = (tech: string) => {
    setValue(
      'technologies',
      technologies.filter((t) => t !== tech),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      if (isEdit) {
        await updateProject.mutateAsync(data);
        toast({ title: 'Project updated' });
        navigate(`/projects/${id}`);
      } else {
        const created = await createProject.mutateAsync(data);
        toast({ title: 'Project created' });
        navigate(`/projects/${created.id}`);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      toast({
        title: 'Error saving project',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  if (isEdit && isLoading)
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <div key={id ?? 'new'} className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={isEdit ? `/projects/${id}` : '/projects'}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Project' : 'Add Project'}
        </h2>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" {...register('name')} placeholder="Enterprise ERP System" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input id="client" {...register('client')} placeholder="Acme Corp" />
                {errors.client && (
                  <p className="text-destructive text-xs">{errors.client.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...register('location')} placeholder="Cairo, Egypt" />
                {errors.location && (
                  <p className="text-destructive text-xs">{errors.location.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-destructive text-xs">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (leave empty if ongoing)</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Project overview…"
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
            </div>

            {/* Technologies */}
            <div className="space-y-2">
              <Label htmlFor="tech-input">Technologies</Label>
              <div className="flex gap-2">
                <Input
                  id="tech-input"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                  placeholder="e.g. React, Node.js"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon" onClick={addTech} aria-label="Add technology">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="hover:text-destructive"
                      aria-label={`Remove technology ${tech}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {errors.technologies && (
                <p className="text-destructive text-xs">At least one technology is required</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : isEdit ? (
                'Update Project'
              ) : (
                'Create Project'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
