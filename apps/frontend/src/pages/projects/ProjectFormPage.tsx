import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, X, Plus, Trash2 } from 'lucide-react';
import type { Participation, Staff } from '@cv-generator/shared';
import { CreateProjectSchema, type CreateProjectInput } from '@cv-generator/shared';
import { useProjectDetail, useCreateProject, useUpdateProject } from '@/hooks/useProjects';
import { useStaffList } from '@/hooks/useStaff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { StaffSuggestionsCard } from './StaffSuggestionsCard';

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: existing, isLoading } = useProjectDetail(id ?? '');
  const createProject = useCreateProject();
  const updateProject = useUpdateProject(id ?? '');
  const { data: staffList } = useStaffList();

  const [techInput, setTechInput] = useState('');

  const existingTechs = (existing?.technologies as string[] | undefined) ?? [];
  const existingParticipations =
    (existing as unknown as { participations?: Participation[] })?.participations ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
    values: existing
      ? {
          name: existing.name,
          description: existing.description,
          client: existing.client,
          location: existing.location,
          startDate: String(existing.startDate).split('T')[0] ?? '',
          endDate: existing.endDate ? (String(existing.endDate).split('T')[0] ?? null) : null,
          technologies: existingTechs,
          participations: existingParticipations.map((p: Participation) => ({
            staffId: p.staffId,
            role: p.role,
            responsibilities: p.responsibilities,
          })),
        }
      : {
          name: '',
          description: '',
          client: '',
          location: '',
          startDate: '',
          endDate: null,
          technologies: [],
          participations: [],
        },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const technologies = watch('technologies') || [];

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participations',
  });

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
      { shouldValidate: true },
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
      <div
        className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="w-8 h-8 animate-spin text-accent" aria-hidden="true" />
        <span className="text-sm font-medium">Loading project...</span>
      </div>
    );

  return (
    <div key={id ?? 'new'} className="max-w-6xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={isEdit ? `/projects/${id}` : '/projects'}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {isEdit ? 'Edit Project' : 'Add Project'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Card className="shadow-none border border-border bg-card">
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
                  <Textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    className="resize-none"
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addTech}
                      aria-label="Add technology"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 text-xs bg-secondary text-primary border border-border pl-2.5 pr-1.5 py-0.5 rounded-full font-medium"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="hover:text-destructive focus-visible:text-destructive transition-colors outline-none cursor-pointer"
                          aria-label={`Remove technology ${tech}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.technologies && (
                    <p className="text-destructive text-xs">At least one technology is required</p>
                  )}
                </div>

                {/* Participations */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-semibold text-foreground">Assigned Staff</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ staffId: '', role: '', responsibilities: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Staff
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-border rounded-lg bg-muted/20 p-4 relative hover:bg-muted/30 transition-colors duration-150"
                    >
                      <div className="space-y-4 pr-8">
                        <div className="space-y-2">
                          <Label htmlFor={`participations.${index}.staffId`}>Staff Member</Label>
                          <Controller
                            control={control}
                            name={`participations.${index}.staffId` as const}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <SelectTrigger id={`participations.${index}.staffId`}>
                                  <SelectValue placeholder="Select Staff..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {staffList?.data?.map((staff: Staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                      {staff.name} - {staff.jobTitle}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.participations?.[index]?.staffId && (
                            <p className="text-destructive text-xs">
                              {errors.participations[index]?.staffId?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`participations.${index}.role`}>Role</Label>
                          <Input
                            id={`participations.${index}.role`}
                            placeholder="e.g. Lead Developer"
                            {...register(`participations.${index}.role` as const)}
                          />
                          {errors.participations?.[index]?.role && (
                            <p className="text-destructive text-xs">
                              {errors.participations[index]?.role?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`participations.${index}.responsibilities`}>
                            Responsibilities
                          </Label>
                          <Textarea
                            id={`participations.${index}.responsibilities`}
                            placeholder="e.g. Architected the backend and managed deployments."
                            {...register(`participations.${index}.responsibilities` as const)}
                          />
                          {errors.participations?.[index]?.responsibilities && (
                            <p className="text-destructive text-xs">
                              {errors.participations[index]?.responsibilities?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-md"
                        onClick={() => remove(index)}
                        aria-label="Remove staff assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" type="button" asChild>
                    <Link to={isEdit ? `/projects/${id}` : '/projects'}>Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="min-w-32">
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
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <StaffSuggestionsCard
            technologies={technologies}
            assignedStaffIds={fields.map((f) => f.staffId)}
            onAddStaff={(staffId) => append({ staffId, role: '', responsibilities: '' })}
          />
        </div>
      </div>
    </div>
  );
}
