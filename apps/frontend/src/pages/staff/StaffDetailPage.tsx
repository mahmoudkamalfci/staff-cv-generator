import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText, Loader2 } from 'lucide-react';
import { useStaffDetail } from '@/hooks/useStaff';
import { useAuth } from '@/hooks/useAuth';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SkillsManager } from '@/components/staff/SkillsManager';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: staff, isLoading } = useStaffDetail(id!);
  const { data: templates } = useTemplateList();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!staff) return <p className="text-muted-foreground">Staff member not found.</p>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/staff">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Staff
          </Link>
        </Button>
        {user?.role === 'admin' && (
          <Button variant="outline" size="sm" asChild>
            <Link to={`/staff/${id}/edit`}>
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </Link>
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-20 h-20">
              <AvatarImage src={staff.photoUrl ?? undefined} alt={staff.name} />
              <AvatarFallback className="bg-accent/20 text-accent text-xl font-bold">
                {getInitials(staff.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{staff.name}</h2>
              <p className="text-muted-foreground">{staff.jobTitle}</p>
              <Badge variant="secondary" className="mt-2">
                {staff.yearsExperience} year{staff.yearsExperience !== 1 ? 's' : ''} experience
              </Badge>
              <Separator className="my-4" />
              <p className="text-sm text-foreground leading-relaxed">{staff.summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsManager
            staffId={id!}
            skills={staff.skills ?? []}
            canEdit={user?.role === 'admin'}
          />
        </CardContent>
      </Card>

      {/* Generate CV */}
      <Card className="shadow-card border-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-5 h-5 text-accent" />
            Generate CV
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48 space-y-1">
            <Label htmlFor="template-select" className="text-xs">Template</Label>
            <Select onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template-select">
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="accent"
            disabled={!selectedTemplate}
            onClick={() => navigate(`/cv/preview/${id}/${selectedTemplate}`)}
          >
            Generate CV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
