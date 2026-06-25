import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Loader2, LayoutTemplate } from 'lucide-react';
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
import { api } from '@/lib/api';
import type { CVData } from '@cv-generator/shared';

export default function CVGeneratorPage() {
  const { data: staff, isLoading: staffLoading } = useStaffList();
  const { data: templates, isLoading: templatesLoading } = useTemplateList();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();

  const selectedStaff = staff?.find((s) => s.id === selectedStaffId);
  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  const canGenerate = !!selectedStaffId && !!selectedTemplateId;

  const handlePreview = () => {
    if (canGenerate) {
      navigate(`/cv/preview/${selectedStaffId}/${selectedTemplateId}`);
    }
  };

  const handleDownload = async () => {
    if (!canGenerate) return;
    setDownloading(true);
    try {
      const cvResponse = await api
        .get<{ data: CVData }>(`/cv/${selectedStaffId}/${selectedTemplateId}`)
        .then((r) => r.data.data);

      const { pdf } = await import('@react-pdf/renderer');
      const CVDocumentMod = await import('@/components/cv-templates/CVDocument');
      const CVDocumentComponent = CVDocumentMod.default;

      const blob = await pdf(
        // @ts-expect-error — JSX in dynamic import context
        <CVDocumentComponent data={cvResponse} config={cvResponse.template.config} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvResponse.staff.name.replace(/\s+/g, '_')}-CV.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
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
          <Select onValueChange={setSelectedStaffId} disabled={staffLoading}>
            <SelectTrigger>
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
          <div className="grid grid-cols-1 gap-3">
            {templatesLoading ? (
              <p className="text-muted-foreground text-sm">Loading templates…</p>
            ) : (
              templates?.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={!canGenerate}
          onClick={handlePreview}
        >
          <FileText className="w-5 h-5 mr-2" />
          Preview CV
        </Button>
        <Button
          variant="default"
          size="lg"
          className="flex-1"
          disabled={!canGenerate || downloading}
          onClick={handleDownload}
        >
          {downloading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          {downloading
            ? 'Generating…'
            : selectedStaff && selectedTemplate
              ? `Download ${selectedTemplate.name} CV`
              : 'Download PDF'}
        </Button>
      </div>
    </div>
  );
}
