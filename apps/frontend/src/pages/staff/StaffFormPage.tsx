import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import { CreateStaffSchema, type CreateStaffInput } from '@cv-generator/shared';
import {
  useStaffDetail,
  useCreateStaff,
  useUpdateStaff,
  useUploadStaffPhoto,
} from '@/hooks/useStaff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

export default function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: existing, isLoading } = useStaffDetail(id ?? '');
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff(id ?? '');
  const uploadPhoto = useUploadStaffPhoto(id ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffInput>({
    resolver: zodResolver(CreateStaffSchema),
    values: existing
      ? {
          name: existing.name,
          jobTitle: existing.jobTitle,
          yearsExperience: existing.yearsExperience,
          summary: existing.summary,
        }
      : undefined,
  });

  const onSubmit = async (data: CreateStaffInput) => {
    if (isEdit) {
      await updateStaff.mutateAsync(data);
      toast({ title: 'Profile updated' });
      navigate(`/staff/${id}`);
    } else {
      const created = await createStaff.mutateAsync(data);
      toast({ title: 'Staff member added' });
      navigate(`/staff/${created.id}`);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadPhoto.mutateAsync(file);
    toast({ title: 'Photo updated' });
  };

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
        <Button variant="ghost" size="sm" asChild>
          <Link to={isEdit ? `/staff/${id}` : '/staff'}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
        <h2 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Edit Staff Member' : 'Add Staff Member'}
        </h2>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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

            <Button type="submit" disabled={isSubmitting} className="w-full">
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
        </CardContent>
      </Card>

      {isEdit && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <Button
              variant="outline"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
