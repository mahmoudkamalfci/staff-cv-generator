import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Suspense, lazy, useState } from 'react';
import type { CVData } from '@cv-generator/shared';

// CVDocument is its own Vite chunk — only loaded when this page renders
const CVDocument = lazy(() => import('@/components/cv-templates/CVDocument'));

const PDFViewer = lazy(() =>
  import('@react-pdf/renderer').then((mod) => ({ default: mod.PDFViewer }))
);

// CVContent suspends while CV data loads — toolbar renders immediately
function CVContent({ staffId, templateId }: { staffId: string; templateId: string }) {
  const { data } = useSuspenseQuery<CVData>({
    queryKey: ['cv', staffId, templateId],
    queryFn: () =>
      api
        .get<{ data: CVData }>(`/cv/${staffId}/${templateId}`)
        .then((r) => r.data.data),
  });

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
      {/* @ts-expect-error - PDFViewer styling and custom types */}
      <PDFViewer width="100%" height="100%" style={{ minHeight: '80vh', border: 'none' }}>
        <CVDocument data={data} config={data.template.config} />
      </PDFViewer>
    </Suspense>
  );
}

function DownloadButton({ staffId, templateId }: { staffId: string; templateId: string }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const cvResponse = await api
        .get<{ data: CVData }>(`/cv/${staffId}/${templateId}`)
        .then((r) => r.data.data);

      const { pdf } = await import('@react-pdf/renderer');
      const CVDocumentMod = await import('@/components/cv-templates/CVDocument');
      const CVDocumentComponent = CVDocumentMod.default;

      const blob = await pdf(
        // @ts-expect-error — dynamic import renders fine at runtime
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
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleDownload} variant="default" size="sm" disabled={loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Generating…' : 'Download PDF'}
    </Button>
  );
}

export default function CVPreviewPage() {
  const { staffId, templateId } = useParams<{ staffId: string; templateId: string }>();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Static toolbar — renders IMMEDIATELY, no data needed */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/cv">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Generator
          </Button>
        </Link>
        <DownloadButton staffId={staffId!} templateId={templateId!} />
      </div>

      {/* Data-driven zone — suspends while CV data + PDFViewer loads */}
      <div className="flex-1 p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          }
        >
          <CVContent staffId={staffId!} templateId={templateId!} />
        </Suspense>
      </div>
    </div>
  );
}
