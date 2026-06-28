import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import type { Participation, Project } from '@cv-generator/shared';
import { CreateStaffSchema, UpdateStaffSchema, type CreateStaffInput } from '@cv-generator/shared';
import {
  useStaffDetail,
  useCreateStaff,
  useUpdateStaff,
  useUploadStaffPhoto,
  useResetPassword,
} from '@/hooks/useStaff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectList } from '@/hooks/useProjects';
import { Plus, Trash2 } from 'lucide-react';

type StaffFormValues = Omit<CreateStaffInput, 'email' | 'password'> & {
  email?: string;
  password?: string;
};

export default function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const { data: existing, isLoading } = useStaffDetail(id ?? '');

  useEffect(() => {
    if (!user || isLoading) return;
    
    const canAccess = user.role === 'admin' || (isEdit && existing?.userId === user.id);
    
    if (!canAccess) {
      toast({
        title: 'Access denied',
        variant: 'destructive',
      });
      navigate('/staff', { replace: true });
    }
  }, [user, navigate, toast, isEdit, existing, isLoading]);
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff(id ?? '');
  const uploadPhoto = useUploadStaffPhoto(id ?? '');
  const resetPasswordMutation = useResetPassword(id ?? '');

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    try {
      await resetPasswordMutation.mutateAsync({ password: newPassword });
      toast({ title: 'Password reset successfully' });
      setIsResetDialogOpen(false);
      setNewPassword('');
    } catch {
      toast({ title: 'Failed to reset password', variant: 'destructive' });
    }
  };

  const { data: projectsData } = useProjectList();
  const projects = projectsData?.data || [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(isEdit ? UpdateStaffSchema : CreateStaffSchema),
    values: existing
      ? {
          email: existing.email || '',
          name: existing.name,
          jobTitle: existing.jobTitle,
          yearsExperience: existing.yearsExperience,
          summary: existing.summary,
          skills: existing.skills || [],
          participations:
            existing.participations?.map((p: Participation) => ({
              projectId: p.projectId,
              role: p.role,
              responsibilities: p.responsibilities,
            })) || [],
        }
      : {
          email: '',
          password: '',
          name: '',
          jobTitle: '',
          yearsExperience: 0,
          summary: '',
          skills: [],
          participations: [],
        },
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: 'skills',
  });

  const {
    fields: projectFields,
    append: appendProject,
    remove: removeProject,
  } = useFieldArray({
    control,
    name: 'participations',
  });

  const onSubmit = async (data: StaffFormValues) => {
    try {
      if (isEdit) {
        await updateStaff.mutateAsync(data);
        toast({ title: 'Profile updated' });
        navigate(`/staff/${id}`);
      } else {
        const created = await createStaff.mutateAsync(data as CreateStaffInput);
        toast({ title: 'Staff member added' });
        navigate(`/staff/${created.id}`);
      }
    } catch (err) {
      console.error('Failed to save staff profile:', err);
      toast({
        title: 'Failed to save profile',
        description: 'Please check your inputs and try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      await uploadPhoto.mutateAsync(file);
      toast({ title: 'Photo updated' });
    } catch (err) {
      console.error('Failed to upload photo:', err);
      toast({
        title: 'Photo upload failed',
        description: 'Make sure the image is under 5MB.',
        variant: 'destructive',
      });
    }
  };

  const canEditProfile = user?.role === 'admin' || (isEdit && existing?.userId === user?.id);

  if (!user || (!canEditProfile && !isLoading)) {
    return null;
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center h-64 items-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in" key={id ?? 'new'}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="h-10 px-4">
          <Link to={isEdit ? `/staff/${id}` : '/staff'}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
        </h1>
      </div>

      <Card className="shadow-none border border-border bg-card divide-y divide-border">
        {/* Section 1: Profile Information */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-destructive text-xs">{errors.email.message as string}</p>
              )}
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Secure password"
                />
                {errors.password && (
                  <p className="text-destructive text-xs">{errors.password.message as string}</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} placeholder="John Doe" />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                {...register('jobTitle')}
                placeholder="Senior Software Engineer"
              />
              {errors.jobTitle && (
                <p className="text-destructive text-xs">{errors.jobTitle.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                max={60}
                {...register('yearsExperience', { valueAsNumber: true })}
              />
              {errors.yearsExperience && (
                <p className="text-destructive text-xs">{errors.yearsExperience.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Profile Summary</Label>
              <textarea
                id="summary"
                {...register('summary')}
                rows={4}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Brief professional summary…"
              />
              {errors.summary && (
                <p className="text-destructive text-xs">{errors.summary.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Skills</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-4"
                  onClick={() => appendSkill({ name: '', level: 'beginner' })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Skill
                </Button>
              </div>
              {skillFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card/50"
                >
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Skill Name</Label>
                        <Input
                          {...register(`skills.${index}.name` as const)}
                          placeholder="e.g. React"
                        />
                        {errors.skills?.[index]?.name && (
                          <p className="text-destructive text-xs">
                            {errors.skills[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-accent"
                          {...register(`skills.${index}.level` as const)}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive mt-6 h-10 w-10"
                    onClick={() => removeSkill(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Previous Projects</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-4"
                  onClick={() => appendProject({ projectId: '', role: '', responsibilities: '' })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Project
                </Button>
              </div>
              {projectFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg bg-card/50"
                >
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-accent"
                        {...register(`participations.${index}.projectId` as const)}
                      >
                        <option value="">Select a project...</option>
                        {projects.map((p: Project) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {errors.participations?.[index]?.projectId && (
                        <p className="text-destructive text-xs">
                          {errors.participations[index]?.projectId?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input
                        {...register(`participations.${index}.role` as const)}
                        placeholder="e.g. Frontend Lead"
                      />
                      {errors.participations?.[index]?.role && (
                        <p className="text-destructive text-xs">
                          {errors.participations[index]?.role?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Responsibilities</Label>
                      <textarea
                        {...register(`participations.${index}.responsibilities` as const)}
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
                        placeholder="Describe your contributions..."
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
                    className="text-destructive mt-6 h-10 w-10"
                    onClick={() => removeProject(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-11" size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : isEdit ? (
                'Update Profile'
              ) : (
                'Create Profile'
              )}
            </Button>
          </form>
        </div>

        {/* Section 2: Profile Photo */}
        {isEdit && (
          <div className="p-6">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Profile Photo
            </h2>
            {existing?.photoUrl && (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border border-border mb-4">
                <img
                  src={existing.photoUrl}
                  alt={existing.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => fileRef.current?.click()}
              disabled={uploadPhoto.isPending}
            >
              {uploadPhoto.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Upload Photo
                </>
              )}
            </Button>
            <p className="text-muted-foreground text-xs mt-2">JPG, PNG, or WebP. Max 5MB.</p>
          </div>
        )}

        {/* Section 3: Security */}
        {isEdit && (
          <div className="p-6">
            <h2 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-4">
              Security
            </h2>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="lg" className="h-11">
                  Reset User Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <Button
                    onClick={handleResetPassword}
                    disabled={newPassword.length < 8 || resetPasswordMutation.isPending}
                    className="w-full h-11"
                    size="lg"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Save New Password'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>
    </div>
  );
}
