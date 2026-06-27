import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import type { CVData } from '@cv-generator/shared';
import { usePDF } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';
import { cvKeys } from '@/hooks/useCVData';

import CVDocument from './CVDocument';

export default function CVContent({
  staffId,
  templateId,
}: {
  staffId: string;
  templateId: string;
}) {
  const { data } = useSuspenseQuery<CVData>({
    queryKey: cvKeys.detail(staffId, templateId),
    queryFn: () =>
      api.get<{ data: CVData }>(`/cv/${staffId}/${templateId}`).then((r) => r.data.data),
  });

  const [instance, updateInstance] = usePDF({
    document: <CVDocument data={data} config={data.template.config} />,
  });

  useEffect(() => {
    updateInstance(<CVDocument data={data} config={data.template.config} />);
  }, [data, updateInstance]);

  if (instance.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
      height="100%"
      style={{ minHeight: '80vh', border: 'none' }}
    />
  );
}
