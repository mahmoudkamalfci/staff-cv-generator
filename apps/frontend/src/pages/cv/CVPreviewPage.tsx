import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Suspense, useState, lazy } from 'react';
import type { CVData } from '@cv-generator/shared';

const CVContent = lazy(() => import('@/components/cv-templates/CVContent'));

const SPACES_REGEX = /\s+/g;

function DownloadButton({ staffId, templateId }: { staffId: string; templateId: string }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const cachedData = queryClient.getQueryData<CVData>(['cv', staffId, templateId]);
      const cvResponse =
        cachedData ||
        (await api.get<{ data: CVData }>(`/cv/${staffId}/${templateId}`).then((r) => r.data.data));

      if (!cvResponse) {
        throw new Error('Failed to retrieve CV data');
      }

      const [{ pdf }, { default: CVDocumentComponent }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/cv-templates/CVDocument'),
      ]);

      const blob = await pdf(
        <CVDocumentComponent data={cvResponse} config={cvResponse.template.config} />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvResponse.staff.name.replace(SPACES_REGEX, '_')}-CV.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
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
