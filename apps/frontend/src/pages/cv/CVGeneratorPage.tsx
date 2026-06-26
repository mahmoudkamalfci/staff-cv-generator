import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, LayoutTemplate } from 'lucide-react';
import { useStaffList } from '@/hooks/useStaff';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export default function CVGeneratorPage() {
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const navigate = useNavigate();

  const selectedStaff = staff?.find((s) => s.id === selectedStaffId);
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const handleGenerate = () => {
    if (selectedStaffId && selectedTemplateId) {
      navigate(`/cv/preview/${selectedStaffId}/${selectedTemplateId}`);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">CV Generator</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a staff member and a template to generate a professional CV.
        </p>
      </div>

      {/* Step 1: Select Staff */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              1
            </span>
            Select Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="staff-select" className="sr-only">Select Staff Member</Label>
          <Select onValueChange={setSelectedStaffId} disabled={staffLoading}>
            <SelectTrigger id="staff-select">
              <SelectValue placeholder={staffLoading ? 'Loading…' : 'Choose a staff member'} />
            </SelectTrigger>
            <SelectContent>
              {staff?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    <span className="text-muted-foreground text-xs">— {s.jobTitle}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStaff && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedStaff.photoUrl ?? undefined} />
                <AvatarFallback className="bg-accent/20 text-accent text-sm font-bold">
                  {getInitials(selectedStaff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStaff.jobTitle}</p>
              </div>
              <Badge variant="secondary" className="ml-auto text-xs">
                {selectedStaff.yearsExperience} yrs exp
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Template */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              2
            </span>
            Select Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Select CV Template">
            {templatesLoading ? (
              <p className="text-muted-foreground text-sm">Loading templates…</p>
            ) : (
              templates?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  role="radio"
                  aria-checked={selectedTemplateId === template.id}
                  className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                    selectedTemplateId === template.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutTemplate
                      className={`w-5 h-5 ${selectedTemplateId === template.id ? 'text-accent' : 'text-muted-foreground'}`}
                    />
                    <div>
                      <p className="font-medium text-sm text-foreground">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    {selectedTemplateId === template.id && (
                      <Badge className="ml-auto bg-accent/20 text-accent border-0 text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate */}
      <Button
        variant="accent"
        size="lg"
        className="w-full"
        disabled={!selectedStaffId || !selectedTemplateId}
        onClick={handleGenerate}
      >
        <FileText className="w-5 h-5 mr-2" />
        {selectedStaff && selectedTemplate
          ? `Generate ${selectedTemplate.name} CV for ${selectedStaff.name}`
          : 'Generate CV'}
      </Button>
    </div>
  );
}
