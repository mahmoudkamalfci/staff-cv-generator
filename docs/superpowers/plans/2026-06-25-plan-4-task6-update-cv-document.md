# Plan 4 — Task 6 Update: CVDocument & react-pdf Rendering Engine

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Context:** This document replaces Task 6 of the original Plan 4 (`docs/superpowers/plans/2026-06-25-plan-4-frontend-features.md`). Tasks 1–5 of Plan 4 are **not changed**. This plan assumes Plan 5 (backend extension) is already complete — `GET /api/cv/:staffId/:templateId` now returns `template.config` (a `TemplateConfig` object) in its response.

**Goal:** Replace the three static React DOM template components and `window.print()` export with a single `CVDocument` component powered by `@react-pdf/renderer`, a `<PDFViewer>` preview page, and an inline download button on the CV Generator page.

**Architecture:** `CVDocument.tsx` is the **only** file that imports `@react-pdf/renderer`. It is lazy-loaded via `React.lazy`. The CV Generator page gains a "Download PDF" button that triggers an inline blob download without navigating away. The CV Preview page renders a `<PDFViewer>` iframe — what the user sees IS the actual PDF output.

**Tech Stack:** `@react-pdf/renderer` ^4.x, React 18, TypeScript 5, `@tanstack/react-query` v5, `@cv-generator/shared` types

## Global Constraints

- `@react-pdf/renderer` MUST NOT appear as a static top-level import in any file except `CVDocument.tsx`
- `CVDocument.tsx` itself is loaded via `React.lazy` in all consuming pages — it is its own Vite chunk
- All API calls go through `api` from `@/lib/api`
- `TemplateConfig` and `CVData` types come from `@cv-generator/shared`
- `CVData.template.config` is the `TemplateConfig` object used for rendering
- Workspace root: `/home/mahmoud/frontend-projects/practise-projects/staff-cv-generator`

---

### Task 1: Install @react-pdf/renderer

**Files:**

- Modify: `apps/frontend/package.json`

**Interfaces:**

- Produces: `@react-pdf/renderer` available as a dependency in the frontend app

- [ ] **Step 1: Install the package**

```bash
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator
pnpm --filter @cv-generator/frontend add @react-pdf/renderer
```

Expected: `@react-pdf/renderer` appears in `apps/frontend/package.json` under `dependencies`.

- [ ] **Step 2: Verify the install does not break the frontend build**

```bash
pnpm --filter @cv-generator/frontend build
```

Expected: Build completes without errors (the package is not yet imported anywhere — just installed).

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/package.json pnpm-lock.yaml
git commit -m "feat(frontend): install @react-pdf/renderer"
```

---

### Task 2: CVDocument — The Single Rendering Component

**Files:**

- Create: `apps/frontend/src/components/cv-templates/CVDocument.tsx`
- Delete (if they exist from earlier Plan 4 work): `apps/frontend/src/components/cv-templates/ClassicTemplate.tsx`, `ModernTemplate.tsx`, `CompactTemplate.tsx`

**Interfaces:**

- Consumes:
  - `CVData` from `@cv-generator/shared`
  - `TemplateConfig`, `SectionConfig` from `@cv-generator/shared`
- Produces:
  - `CVDocument({ data: CVData, config: TemplateConfig })` → react-pdf `<Document>` element
  - Default export for use with `React.lazy`

- [ ] **Step 1: Create `apps/frontend/src/components/cv-templates/CVDocument.tsx`**

```tsx
// IMPORTANT: @react-pdf/renderer is ONLY imported in this file.
// All other files that need PDF rendering must lazy-load this component.
import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import type { CVData, TemplateConfig, SectionConfig } from '@cv-generator/shared';

// Register a clean sans-serif font (built into react-pdf — no network request)
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
  // Fallback: react-pdf bundles Helvetica-like font by default if this URL is unavailable
});

interface Props {
  data: CVData;
  config: TemplateConfig;
}

// --- Styles factory (called once per render with the template colors) ---
function makeStyles(primaryColor: string, accentColor: string) {
  return StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
    },
    // Layout containers
    body: { flexDirection: 'row', flex: 1 },
    mainCol: { flex: 1, padding: '20pt 24pt' },
    sideCol: { width: '160pt', backgroundColor: '#f1f5f9', padding: '20pt 14pt' },
    fullCol: { flex: 1, padding: '20pt 32pt' },
    // Header
    headerBox: {
      backgroundColor: primaryColor,
      padding: '24pt 32pt',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerPhoto: { width: 64, height: 64, borderRadius: 32, objectFit: 'cover' },
    headerName: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
    headerTitle: { fontSize: 12, color: '#ffffffcc', marginTop: 3 },
    headerYears: { fontSize: 9, color: '#ffffff99', marginTop: 2 },
    // Section headings
    sectionHeading: {
      fontSize: 8,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: accentColor,
      borderBottomWidth: 1,
      borderBottomColor: accentColor,
      paddingBottom: 3,
      marginBottom: 8,
      marginTop: 14,
    },
    // Summary
    summaryText: { fontSize: 10, lineHeight: 1.5, color: '#374151' },
    // Skills
    skillRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    skillName: { fontSize: 9, color: '#1f2937', fontWeight: 'bold' },
    skillLevel: { fontSize: 8, color: '#6b7280', textTransform: 'capitalize' },
    skillBar: { height: 3, backgroundColor: '#e5e7eb', borderRadius: 2, marginTop: 2 },
    skillFill: { height: 3, backgroundColor: accentColor, borderRadius: 2 },
    // Experience
    expCard: {
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
      paddingLeft: 8,
      marginBottom: 12,
    },
    expProject: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
    expMeta: { fontSize: 8, color: '#6b7280', marginTop: 1 },
    expRole: { fontSize: 9, fontWeight: 'bold', color: accentColor, marginTop: 3 },
    expDesc: { fontSize: 9, color: '#374151', marginTop: 3, lineHeight: 1.4 },
    techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 4 },
    techChip: {
      fontSize: 7,
      backgroundColor: '#f3f4f6',
      color: '#374151',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
    },
    // Custom section
    customText: { fontSize: 10, color: '#374151', lineHeight: 1.5 },
  });
}

// --- Section level-to-width map ---
const LEVEL_WIDTH: Record<string, string> = {
  beginner: '25%',
  intermediate: '50%',
  advanced: '75%',
  expert: '100%',
};

// --- Individual section renderers ---
function HeaderSection({ data, styles }: { data: CVData; styles: ReturnType<typeof makeStyles> }) {
  const { staff } = data;
  return (
    <View style={styles.headerBox}>
      {staff.photoUrl && <Image style={styles.headerPhoto} src={staff.photoUrl} />}
      <View>
        <Text style={styles.headerName}>{staff.name}</Text>
        <Text style={styles.headerTitle}>{staff.jobTitle}</Text>
        <Text style={styles.headerYears}>{staff.yearsExperience} years of experience</Text>
      </View>
    </View>
  );
}

function SummarySection({
  data,
  label,
  styles,
}: {
  data: CVData;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View>
      <Text style={styles.sectionHeading}>{label}</Text>
      <Text style={styles.summaryText}>{data.staff.summary}</Text>
    </View>
  );
}

function SkillsSection({
  data,
  label,
  styles,
}: {
  data: CVData;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View>
      <Text style={styles.sectionHeading}>{label}</Text>
      {data.skills.map((skill) => (
        <View key={skill.id}>
          <View style={styles.skillRow}>
            <Text style={styles.skillName}>{skill.name}</Text>
            <Text style={styles.skillLevel}>{skill.level}</Text>
          </View>
          <View style={styles.skillBar}>
            <View style={[styles.skillFill, { width: LEVEL_WIDTH[skill.level] ?? '50%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ExperienceSection({
  data,
  label,
  styles,
}: {
  data: CVData;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'Present';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <View>
      <Text style={styles.sectionHeading}>{label}</Text>
      {data.participations.map((p) => (
        <View key={p.id} style={styles.expCard}>
          <Text style={styles.expProject}>{p.project.name}</Text>
          <Text style={styles.expMeta}>
            {p.project.client} · {p.project.location} · {formatDate(p.project.startDate)} —{' '}
            {formatDate(p.project.endDate)}
          </Text>
          <Text style={styles.expRole}>{p.role}</Text>
          <Text style={styles.expDesc}>{p.responsibilities}</Text>
          <View style={styles.techWrap}>
            {(p.project.technologies as string[]).map((t) => (
              <Text key={t} style={styles.techChip}>
                {t}
              </Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function CustomSection({
  section,
  styles,
}: {
  section: SectionConfig;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View>
      <Text style={styles.sectionHeading}>{section.label}</Text>
      {section.content && <Text style={styles.customText}>{section.content}</Text>}
    </View>
  );
}

// --- Layout renderers ---
function renderSection(
  section: SectionConfig,
  data: CVData,
  styles: ReturnType<typeof makeStyles>,
) {
  switch (section.id) {
    case 'summary':
      return <SummarySection key={section.id} data={data} label={section.label} styles={styles} />;
    case 'skills':
      return <SkillsSection key={section.id} data={data} label={section.label} styles={styles} />;
    case 'experience':
      return (
        <ExperienceSection key={section.id} data={data} label={section.label} styles={styles} />
      );
    case 'custom':
      return <CustomSection key={`custom-${section.order}`} section={section} styles={styles} />;
    default:
      return null;
  }
}

function OneColumnLayout({
  data,
  config,
  styles,
}: {
  data: CVData;
  config: TemplateConfig;
  styles: ReturnType<typeof makeStyles>;
}) {
  const sections = config.sections
    .filter((s) => s.visible && s.id !== 'header')
    .sort((a, b) => a.order - b.order);

  return <View style={styles.fullCol}>{sections.map((s) => renderSection(s, data, styles))}</View>;
}

function TwoColumnLayout({
  data,
  config,
  styles,
}: {
  data: CVData;
  config: TemplateConfig;
  styles: ReturnType<typeof makeStyles>;
}) {
  const sections = config.sections
    .filter((s) => s.visible && s.id !== 'header')
    .sort((a, b) => a.order - b.order);

  const sidebarSections = sections.filter((s) => s.id === 'skills' || s.id === 'custom');
  const mainSections = sections.filter((s) => s.id !== 'skills' && s.id !== 'custom');

  return (
    <View style={styles.body}>
      <View style={styles.sideCol}>
        {sidebarSections.map((s) => renderSection(s, data, styles))}
      </View>
      <View style={styles.mainCol}>{mainSections.map((s) => renderSection(s, data, styles))}</View>
    </View>
  );
}

function ThreeColumnLayout({
  data,
  config,
  styles,
}: {
  data: CVData;
  config: TemplateConfig;
  styles: ReturnType<typeof makeStyles>;
}) {
  const sections = config.sections
    .filter((s) => s.visible && s.id !== 'header')
    .sort((a, b) => a.order - b.order);

  const col1 = sections.filter((s) => s.id === 'skills');
  const col2 = sections.filter((s) => s.id === 'experience' || s.id === 'summary');
  const col3 = sections.filter((s) => s.id === 'custom');

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <View style={{ width: '120pt', backgroundColor: '#f8fafc', padding: '14pt 10pt' }}>
        {col1.map((s) => renderSection(s, data, styles))}
      </View>
      <View style={{ flex: 1, padding: '14pt 16pt' }}>
        {col2.map((s) => renderSection(s, data, styles))}
      </View>
      <View style={{ width: '120pt', backgroundColor: '#f8fafc', padding: '14pt 10pt' }}>
        {col3.map((s) => renderSection(s, data, styles))}
      </View>
    </View>
  );
}

// --- Main CVDocument export ---
export default function CVDocument({ data, config }: Props) {
  const styles = makeStyles(config.primaryColor, config.accentColor);

  return (
    <Document title={`${data.staff.name} — CV`} author="CV Generator">
      <Page size="A4" style={styles.page}>
        <HeaderSection data={data} styles={styles} />
        {config.baseLayout === 'one-column' && (
          <OneColumnLayout data={data} config={config} styles={styles} />
        )}
        {config.baseLayout === 'two-column' && (
          <TwoColumnLayout data={data} config={config} styles={styles} />
        )}
        {config.baseLayout === 'three-column' && (
          <ThreeColumnLayout data={data} config={config} styles={styles} />
        )}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Remove the old static template files (if they exist)**

```bash
rm -f /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator/apps/frontend/src/components/cv-templates/ClassicTemplate.tsx
rm -f /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator/apps/frontend/src/components/cv-templates/ModernTemplate.tsx
rm -f /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator/apps/frontend/src/components/cv-templates/CompactTemplate.tsx
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/components/cv-templates/CVDocument.tsx
git commit -m "feat(frontend): add CVDocument react-pdf rendering engine"
```

---

### Task 3: Updated CVPreviewPage — PDFViewer

**Files:**

- Modify: `apps/frontend/src/pages/cv/CVPreviewPage.tsx`

**Interfaces:**

- Consumes:
  - `useSuspenseQuery` from `@tanstack/react-query`
  - `api` from `@/lib/api`
  - `CVData`, `TemplateConfig` from `@cv-generator/shared`
  - `CVDocument` (default export) from `@/components/cv-templates/CVDocument` via `React.lazy`
  - `PDFViewer` from `@react-pdf/renderer` via dynamic import
- Produces:
  - Route `/cv/preview/:staffId/:templateId` — renders a sticky toolbar + `<PDFViewer>` iframe showing the live PDF

- [ ] **Step 1: Replace `apps/frontend/src/pages/cv/CVPreviewPage.tsx`**

```tsx
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Suspense, lazy, useState } from 'react';
import type { CVData } from '@cv-generator/shared';

// CVDocument is its own Vite chunk — only loaded when this page renders
const CVDocument = lazy(() => import('@/components/cv-templates/CVDocument'));

// CVContent suspends while CV data loads — toolbar renders immediately
function CVContent({ staffId, templateId }: { staffId: string; templateId: string }) {
  const { data } = useSuspenseQuery<CVData>({
    queryKey: ['cv', staffId, templateId],
    queryFn: () =>
      api.get<{ data: CVData }>(`/cv/${staffId}/${templateId}`).then((r) => r.data.data),
  });

  const [PDFViewer, setPDFViewer] = useState<React.ComponentType<
    React.PropsWithChildren<{
      width: string;
      height: string;
      style?: React.CSSProperties;
    }>
  > | null>(null);

  // Lazy-load PDFViewer on mount (only after data is ready)
  if (!PDFViewer) {
    import('@react-pdf/renderer').then((mod) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPDFViewer(() => (mod as any).PDFViewer);
    });
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      }
    >
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
        <CVDocumentComponent data={cvResponse} config={cvResponse.template.config} />,
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/pages/cv/CVPreviewPage.tsx
git commit -m "feat(frontend): replace window.print with PDFViewer in CVPreviewPage"
```

---

### Task 4: Updated CVGeneratorPage — Inline Download Button

**Files:**

- Modify: `apps/frontend/src/pages/cv/CVGeneratorPage.tsx`

**Interfaces:**

- Consumes:
  - `useStaffList` from `@/hooks/useStaff`
  - `useTemplateList` from `@/hooks/useTemplates`
  - `api` from `@/lib/api`
  - `CVData` from `@cv-generator/shared`
  - `CVDocument` via dynamic import (on button click only)
  - `pdf` from `@react-pdf/renderer` via dynamic import (on button click only)
- Produces:
  - CV Generator page with two action buttons: "Preview CV" (navigates) + "Download PDF" (inline blob download)

- [ ] **Step 1: Replace `apps/frontend/src/pages/cv/CVGeneratorPage.tsx`**

```tsx
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
        <CVDocumentComponent data={cvResponse} config={cvResponse.template.config} />,
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
```

- [ ] **Step 2: Update `useTemplates.ts` — the `CVTemplate` type now includes `config`**

The `useTemplateList` hook returns data typed from the backend. The backend now returns `config` as part of each template object. Since `CVTemplate` type in `@cv-generator/shared` has been extended in Plan 5 Task 1, no hook code changes are needed — TypeScript will automatically pick up the new `config` field.

Verify this compiles:

```bash
pnpm --filter @cv-generator/frontend build
```

Expected: Build completes without errors.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/cv/CVGeneratorPage.tsx
git commit -m "feat(frontend): add inline PDF download button to CVGeneratorPage"
```

---

### Task 5: End-to-End Verification

**Files:** No new files — this task is verification only.

- [ ] **Step 1: Start both backend and frontend in dev mode**

```bash
# Terminal 1
cd /home/mahmoud/frontend-projects/practise-projects/staff-cv-generator
pnpm dev
```

- [ ] **Step 2: Verify the CV Generator page flow**

1. Navigate to `http://localhost:5173/cv`
2. Select a staff member from the dropdown
3. Select a template (e.g. "Classic")
4. Click "Preview CV" → should navigate to `/cv/preview/:staffId/:templateId`
5. The preview page should show a PDF rendered in an iframe (the `<PDFViewer>`)
6. The PDF should render the staff name, job title, skills, and project experience
7. Click "Download PDF" on the preview page → a `.pdf` file should download
8. Return to the generator page
9. Click "Download PDF" directly → same PDF downloads without navigating away

- [ ] **Step 3: Verify template config is respected**

1. In the browser, call the API directly:

```
GET /api/cv/:staffId/:templateId (use the "Modern" template)
```

2. Confirm the response includes `template.config.baseLayout === 'one-column'`
3. Confirm the PDF viewer shows the single-column layout for Modern vs two-column for Classic

- [ ] **Step 4: Commit any fixes, then final commit**

```bash
git commit --allow-empty -m "chore(frontend): verify CVDocument pdf rendering end-to-end"
```

---

## Plan 4 Task 6 Update Complete ✅

**Deliverable:** Single `CVDocument.tsx` rendering engine, `<PDFViewer>` preview page, inline PDF download on the generator page. The three old static template DOM components are removed. `@react-pdf/renderer` is isolated to `CVDocument.tsx` and dynamically imported on user action everywhere else.
