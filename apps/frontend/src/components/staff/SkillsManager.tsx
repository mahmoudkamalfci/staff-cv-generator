import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Loader2 } from 'lucide-react';
import { CreateSkillSchema, type CreateSkillInput, type Skill } from '@cv-generator/shared';
import { useAddSkill, useDeleteSkill } from '@/hooks/useStaff';
import { SkillBadge } from './SkillBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface SkillsManagerProps {
  staffId: string;
  skills: Skill[];
  canEdit: boolean;
}

export function SkillsManager({ staffId, skills, canEdit }: SkillsManagerProps) {
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();
  const addSkill = useAddSkill(staffId);
  const deleteSkill = useDeleteSkill(staffId);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateSkillInput>({
    resolver: zodResolver(CreateSkillSchema),
  });

  const onSubmit = async (data: CreateSkillInput) => {
    try {
      await addSkill.mutateAsync(data);
      toast({ title: 'Skill added' });
      reset();
      setAdding(false);
    } catch (error) {
      console.error('Failed to add skill:', error);
      toast({
        title: 'Error adding skill',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSkill.mutateAsync(id);
      toast({ title: 'Skill removed' });
    } catch (error) {
      console.error('Failed to delete skill:', error);
      toast({
        title: 'Error removing skill',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 && (
          <p className="text-muted-foreground text-sm">No skills added yet.</p>
        )}
        {skills.map((skill) => (
          <SkillBadge key={skill.id} skill={skill} onDelete={handleDelete} canDelete={canEdit} />
        ))}
      </div>

      {canEdit && !adding && (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Skill
        </Button>
      )}

      {adding && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label htmlFor="skill-name" className="text-xs">
              Skill name
            </Label>
            <Input
              id="skill-name"
              {...register('name')}
              placeholder="e.g. React"
              className="h-8 w-40"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="skill-level" className="text-xs">
              Level
            </Label>
            <Select onValueChange={(v) => setValue('level', v as CreateSkillInput['level'], { shouldValidate: true })}>
              <SelectTrigger id="skill-level" className="h-8 w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {['beginner', 'intermediate', 'advanced', 'expert'].map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && <p className="text-destructive text-xs mt-1">{errors.level.message}</p>}
          </div>
          <Button type="submit" size="sm" disabled={addSkill.isPending}>
            {addSkill.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
