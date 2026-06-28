import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, LayoutTemplate } from 'lucide-react';
import { useStaffList } from '@/hooks/useStaff';
import { useTemplateList } from '@/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import type { CVTemplate, Staff } from '@cv-generator/shared';

export default function CVGeneratorPage() {
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const navigate = useNavigate();

  const selectedStaff = staff?.data?.find((s: Staff) => s.id === selectedStaffId);
  const selectedTemplate = templates?.find((t: CVTemplate) => t.id === selectedTemplateId);

  const handleGenerate = useCallback(() => {
    if (selectedStaffId && selectedTemplateId) {
      navigate(`/cv/preview/${selectedStaffId}/${selectedTemplateId}`);
    }
  }, [selectedStaffId, selectedTemplateId, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedStaffId && selectedTemplateId) {
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStaffId, selectedTemplateId, handleGenerate]);

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">CV Generator</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select a staff member and a template to generate a professional CV.
        </p>
      </div>

      {/* Step 1: Select Staff */}
      <Card className="shadow-none border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              1
            </span>
            Select Staff Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="staff-select" className="sr-only">
            Select Staff Member
          </Label>
          {staffLoading ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <Select onValueChange={setSelectedStaffId}>
              <SelectTrigger id="staff-select" className="h-11">
                <SelectValue placeholder="Choose a staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff?.data?.map((s: Staff) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground text-xs">— {s.jobTitle}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedStaff && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg border border-border/30">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedStaff.photoUrl ?? undefined} />
                <AvatarFallback className="bg-secondary text-primary text-sm font-bold">
                  {getInitials(selectedStaff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm text-foreground">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStaff.jobTitle}</p>
              </div>
              <Badge
                variant="secondary"
                className="ml-auto text-xs font-semibold bg-muted-foreground/10 text-muted-foreground border-0"
              >
                {selectedStaff.yearsExperience} yrs exp
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Select Template */}
      <Card className="shadow-none border border-border bg-card">
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
              <div className="space-y-3">
                <Skeleton className="h-[60px] w-full" />
                <Skeleton className="h-[60px] w-full" />
              </div>
            ) : (
              templates?.map((template: CVTemplate) => (
                <button
                  key={template.id}
                  type="button"
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
                      <Badge className="ml-auto bg-accent text-accent-foreground border-0 text-xs font-semibold">
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
