import { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';
import CVDocument from '@/components/cv-templates/CVDocument';
import type { CVData, TemplateConfig } from '@cv-generator/shared';

interface Props {
  cvData: CVData;
  config: TemplateConfig;
}

export default function PDFPreviewIframe({ cvData, config }: Props) {
  const [instance, updateInstance] = usePDF({
    document: <CVDocument data={cvData} config={config} />,
  });

  useEffect(() => {
    updateInstance(<CVDocument data={cvData} config={config} />);
  }, [cvData, config, updateInstance]);

  if (instance.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-sm text-muted-foreground">Generating PDF...</span>
      </div>
    );
  }

  if (instance.error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        Error generating PDF: {String(instance.error)}
      </div>
    );
  }

  return (
    <iframe
      src={instance.url || undefined}
      width="100%"
      height="700px"
      style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
    />
  );
}
