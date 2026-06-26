import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateTemplate, useUpdateTemplate, useTemplateDetail } from '@/hooks/useTemplates';
import { Step1Base, DEFAULT_SECTIONS, BUILT_IN_PRESETS } from './wizard/Step1Base';
import { Step2Sections } from './wizard/Step2Sections';
import { Step3Colors } from './wizard/Step3Colors';
import { Step4Preview } from './wizard/Step4Preview';
import type { TemplateConfig, SectionConfig } from '@cv-generator/shared';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const STEPS = [
  { number: 1, title: 'Base Template', description: 'Choose starting layout and name' },
  { number: 2, title: 'Sections', description: 'Reorder and configure sections' },
  { number: 3, title: 'Colors', description: 'Set primary and accent colors' },
  { number: 4, title: 'Preview', description: 'Review and save your template' },
];

export default function TemplateWizardPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();

  const { data: existingTemplate } = useTemplateDetail(id ?? '');
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedBase, setSelectedBase] = useState('Classic');
  const [draftConfig, setDraftConfig] = useState<TemplateConfig>({
    baseLayout: 'two-column',
    primaryColor: '#1e293b',
    accentColor: '#475569',
    sections: DEFAULT_SECTIONS,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: 'Access denied',
        variant: 'destructive',
      });
      navigate('/templates', { replace: true });
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    if (existingTemplate && !isInitialized) {
      setTemplateName(existingTemplate.name);
      setTemplateDescription(existingTemplate.description ?? '');
      setDraftConfig(existingTemplate.config as TemplateConfig);
      setIsInitialized(true);
    }
  }, [existingTemplate, isInitialized]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleSelectBase = (preset: (typeof BUILT_IN_PRESETS)[number]) => {
    setSelectedBase(preset.name);
    setDraftConfig({
      baseLayout: preset.baseLayout,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      sections: DEFAULT_SECTIONS,
    });
  };

  const updateSections = (sections: SectionConfig[]) => {
    setDraftConfig((prev) => ({ ...prev, sections }));
  };

  const canAdvance = (): boolean => {
    if (step === 1) return templateName.trim().length > 0;
    if (step === 2) return draftConfig.sections.some((s) => s.id === 'header' && s.visible);
    return true;
  };

  const handleSave = async () => {
    try {
      if (isEditing && id) {
        await updateTemplate.mutateAsync({
          id,
          input: { name: templateName, description: templateDescription, config: draftConfig },
        });
      } else {
        await createTemplate.mutateAsync({
          name: templateName,
          description: templateDescription,
          config: draftConfig,
        });
      }
      navigate('/templates');
    } catch (err) {
      console.error('Save failed:', err);
      toast({
        title: 'Failed to save template',
        variant: 'destructive',
      });
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 id="wizard-title" className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Template' : 'New Template'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Step {step} of {STEPS.length} — {STEPS[step - 1]?.title}
          </p>
        </div>
        <Button id="cancel-btn" variant="ghost" size="sm" onClick={() => navigate('/templates')}>
          Cancel
        </Button>
      </div>

      {/* Step progress */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <div
            key={s.number}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              s.number <= step ? 'bg-accent' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">{STEPS[step - 1]?.title}</CardTitle>
          <CardDescription>{STEPS[step - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Step1Base
              templateName={templateName}
              templateDescription={templateDescription}
              selectedBase={selectedBase}
              onNameChange={setTemplateName}
              onDescriptionChange={setTemplateDescription}
              onSelectBase={handleSelectBase}
              isEditing={isEditing}
            />
          )}
          {step === 2 && (
            <Step2Sections sections={draftConfig.sections} onChange={updateSections} />
          )}
          {step === 3 && (
            <Step3Colors
              primaryColor={draftConfig.primaryColor}
              accentColor={draftConfig.accentColor}
              onPrimaryChange={(c) => setDraftConfig((p) => ({ ...p, primaryColor: c }))}
              onAccentChange={(c) => setDraftConfig((p) => ({ ...p, accentColor: c }))}
            />
          )}
          {step === 4 && <Step4Preview config={draftConfig} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          id="back-btn"
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {step < 4 ? (
          <Button id="next-btn" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button id="save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Template'}
          </Button>
        )}
      </div>
    </div>
  );
}
