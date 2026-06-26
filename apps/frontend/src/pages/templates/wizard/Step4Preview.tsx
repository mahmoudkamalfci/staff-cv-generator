import { lazy, Suspense, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useStaffList } from '@/hooks/useStaff';
import { api } from '@/lib/api';
import type { CVData, TemplateConfig } from '@cv-generator/shared';

// CVDocument is loaded only when this step is rendered
const CVDocument = lazy(() => import('@/components/cv-templates/CVDocument'));

// Fallback sample data — used if no staff members exist yet
const SAMPLE_DATA: CVData = {
  staff: {
    id: 'sample',
    name: 'Jane Doe',
    jobTitle: 'Senior Software Engineer',
    yearsExperience: 8,
    summary:
      'Experienced software engineer specialising in cloud architecture, distributed systems, and frontend development. Passionate about building scalable, maintainable products.',
    photoUrl: null,
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  skills: [
    { id: '1', staffId: 'sample', name: 'React', level: 'expert' },
    { id: '2', staffId: 'sample', name: 'TypeScript', level: 'advanced' },
    { id: '3', staffId: 'sample', name: 'Node.js', level: 'advanced' },
    { id: '4', staffId: 'sample', name: 'PostgreSQL', level: 'intermediate' },
    { id: '5', staffId: 'sample', name: 'Docker', level: 'intermediate' },
  ],
  participations: [
    {
      id: '1',
      staffId: 'sample',
      projectId: 'p1',
      role: 'Lead Frontend Engineer',
      responsibilities:
        'Led the migration from a legacy monolith to a React microfrontend architecture. Defined component standards and improved page load times by 40%.',
      project: {
        id: 'p1',
        name: 'E-Commerce Platform Relaunch',
        description: 'Full relaunch of core platform',
        client: 'RetailCorp GmbH',
        location: 'Berlin, Germany',
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T00:00:00Z',
        technologies: ['React', 'TypeScript', 'GraphQL', 'AWS'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  ],
  template: {
    id: 'preview',
    name: 'Preview',
    layoutKey: 'preview',
    description: '',
    isActive: true,
    isBuiltIn: false,
    config: {} as TemplateConfig, // overridden by prop
    createdAt: new Date().toISOString(),
  },
  generatedAt: new Date().toISOString(),
};

interface Props {
  config: TemplateConfig;
}

export function Step4Preview({ config }: Props) {
  const { data: staffList } = useStaffList();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<
    React.PropsWithChildren<{
      width: string;
      height: string;
      style?: React.CSSProperties;
    }>
  > | null>(null);

  // Load first real staff member for preview; fall back to sample data
  useEffect(() => {
    const firstStaff = staffList?.[0];
    if (!firstStaff) {
      setCvData({ ...SAMPLE_DATA, template: { ...SAMPLE_DATA.template, config } });
      return;
    }
    api
      .get<{ data: CVData }>(`/cv/${firstStaff.id}/preview-dummy`)
      .then((r) => setCvData({ ...r.data.data, template: { ...r.data.data.template, config } }))
      .catch(() => {
        // If the API call fails (e.g. no template yet), use sample data
        setCvData({ ...SAMPLE_DATA, template: { ...SAMPLE_DATA.template, config } });
      });
  }, [staffList, config]);

  // Lazy-load PDFViewer
  useEffect(() => {
    import('@react-pdf/renderer').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPDFViewer(() => (mod as any).PDFViewer);
    });
  }, []);

  if (!cvData || !PDFViewer) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 text-sm text-muted-foreground">Loading preview…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        This is exactly how the generated PDF will look.
        {!staffList?.[0] && (
          <span className="text-yellow-600 ml-1">
            (Showing sample data — add a staff member to preview with real data.)
          </span>
        )}
      </p>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        }
      >
        <PDFViewer
          width="100%"
          height="700px"
          style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}
        >
          <CVDocument data={cvData} config={config} />
        </PDFViewer>
      </Suspense>
    </div>
  );
}
