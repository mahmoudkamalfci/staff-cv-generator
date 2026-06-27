// IMPORTANT: @react-pdf/renderer is ONLY imported in this file.
// All other files that need PDF rendering must lazy-load this component.
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { CVData, TemplateConfig, SectionConfig } from '@cv-generator/shared';
import { useMemo } from 'react';

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
      color: '#1a1f26',
      backgroundColor: '#ffffff',
    },
    // Layout containers
    body: { flexDirection: 'row', flex: 1 },
    mainCol: { flex: 1, padding: '20pt 24pt 40pt 20pt' },
    sideCol: { width: '160pt', backgroundColor: '#f8fafc', padding: '20pt 16pt 40pt 24pt' },
    fullCol: { flex: 1, padding: '20pt 24pt 40pt 24pt' },
    threeColBody: { flexDirection: 'row', flex: 1 },
    threeColSideLeft: { width: '120pt', backgroundColor: '#f8fafc', padding: '14pt 12pt 40pt 24pt' },
    threeColSideRight: { width: '120pt', backgroundColor: '#f8fafc', padding: '14pt 24pt 40pt 12pt' },
    threeColMain: { flex: 1, padding: '14pt 16pt 40pt 16pt' },
    // Header
    headerBox: {
      backgroundColor: primaryColor,
      padding: '24pt 24pt',
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
      letterSpacing: 1.2,
      color: accentColor,
      borderBottomWidth: 1,
      borderBottomColor: accentColor,
      paddingBottom: 3,
      marginBottom: 8,
      marginTop: 14,
    },
    // Summary
    summaryText: { fontSize: 10, lineHeight: 1.5, color: '#1a1f26' },
    // Skills
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    skillChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#edf0f2',
      borderWidth: 1,
      borderColor: '#dce1e6',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
      marginRight: 4,
      marginBottom: 4,
    },
    skillText: { fontSize: 8, color: '#1a1f26', fontWeight: 'bold' },
    skillLevelText: { fontSize: 7, color: accentColor, marginLeft: 4, fontWeight: 'bold' },
    // Experience
    expCard: {
      borderWidth: 1,
      borderColor: '#dce1e6',
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
    },
    expProject: { fontSize: 11, fontWeight: 'bold', color: '#1a1f26' },
    expMeta: { fontSize: 8, color: '#6b7280', marginTop: 1 },
    expRole: { fontSize: 9, fontWeight: 'bold', color: accentColor, marginTop: 3 },
    expDesc: { fontSize: 9, color: '#1a1f26', marginTop: 3, lineHeight: 1.4 },
    techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    techChip: {
      fontSize: 7,
      backgroundColor: '#edf0f2',
      color: '#1a1f26',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 2,
      marginBottom: 2,
    },
    // Custom section
    customText: { fontSize: 10, color: '#1a1f26', lineHeight: 1.5 },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 15,
      left: 24,
      right: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 0.5,
      borderTopColor: '#dce1e6',
      paddingTop: 6,
    },
    footerLeft: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica' },
    footerRight: { fontSize: 7, color: '#6b7280', fontFamily: 'Helvetica' },
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
      {staff.photoUrl ? <Image style={styles.headerPhoto} src={staff.photoUrl} /> : null}
      <View>
        <Text style={styles.headerName}>{staff.name || ''}</Text>
        <Text style={styles.headerTitle}>{staff.jobTitle || ''}</Text>
        <Text style={styles.headerYears}>
          {(staff.yearsExperience ?? 0) + ' years of experience'}
        </Text>
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
      <Text style={styles.sectionHeading}>{(label || '').toUpperCase()}</Text>
      <Text style={styles.summaryText}>{data.staff.summary || ''}</Text>
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
  const skills = data.staff.skills || [];
  return (
    <View>
      <Text style={styles.sectionHeading}>{(label || '').toUpperCase()}</Text>
      <View style={styles.skillsWrap}>
        {skills.map((skill) => (
          <View key={skill.id} style={styles.skillChip}>
            <Text style={styles.skillText}>{skill.name || ''}</Text>
            {skill.level ? (
              <Text style={styles.skillLevelText}>
                {skill.level.toUpperCase()}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const formatDate = (d: string | null | undefined, fallback = 'Present') => {
  if (!d) return fallback;
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
};

function ExperienceSection({
  data,
  label,
  styles,
}: {
  data: CVData;
  label: string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const participations = data.staff.participations || [];

  return (
    <View>
      <Text style={styles.sectionHeading}>{(label || '').toUpperCase()}</Text>
      {participations.map((p) => {
        const startDateStr = formatDate(p.project.startDate, '');
        const endDateStr = formatDate(p.project.endDate, 'Present');
        const dateRangeStr =
          startDateStr && endDateStr
            ? `${startDateStr} — ${endDateStr}`
            : startDateStr || endDateStr || '';
        const metaParts = [p.project.client, p.project.location, dateRangeStr].filter(Boolean);
        const metaString = metaParts.join(' · ');

        return (
          <View key={p.id} style={styles.expCard}>
            <Text style={styles.expProject}>{p.project.name || ''}</Text>
            <Text style={styles.expMeta}>{metaString}</Text>
            <Text style={styles.expRole}>{p.role || ''}</Text>
            <Text style={styles.expDesc}>{p.responsibilities || ''}</Text>
            <View style={styles.techWrap}>
              {((p.project.technologies || []) as string[]).map((t) => (
                <Text key={t} style={styles.techChip}>
                  {t || ''}
                </Text>
              ))}
            </View>
          </View>
        );
      })}
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
      <Text style={styles.sectionHeading}>{(section.label || '').toUpperCase()}</Text>
      {section.content ? <Text style={styles.customText}>{section.content || ''}</Text> : null}
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

  const sidebarSections = sections.filter(
    (s) => s.id === 'skills' || (s.id === 'custom' && (!s.content || s.content.length <= 150))
  );
  const mainSections = sections.filter(
    (s) => s.id !== 'skills' && !(s.id === 'custom' && (!s.content || s.content.length <= 150))
  );

  return (
    <View style={styles.body}>
      {sidebarSections.length > 0 ? (
        <View style={styles.sideCol}>
          {sidebarSections.map((s) => renderSection(s, data, styles))}
        </View>
      ) : null}
      {mainSections.length > 0 ? (
        <View style={styles.mainCol}>
          {mainSections.map((s) => renderSection(s, data, styles))}
        </View>
      ) : null}
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
  const col2 = sections.filter(
    (s) => s.id === 'experience' || s.id === 'summary' || (s.id === 'custom' && s.content && s.content.length > 150)
  );
  const col3 = sections.filter(
    (s) => s.id === 'custom' && (!s.content || s.content.length <= 150)
  );

  return (
    <View style={styles.threeColBody}>
      {col1.length > 0 ? (
        <View style={styles.threeColSideLeft}>{col1.map((s) => renderSection(s, data, styles))}</View>
      ) : null}
      {col2.length > 0 ? (
        <View style={styles.threeColMain}>{col2.map((s) => renderSection(s, data, styles))}</View>
      ) : null}
      {col3.length > 0 ? (
        <View style={styles.threeColSideRight}>{col3.map((s) => renderSection(s, data, styles))}</View>
      ) : null}
    </View>
  );
}

// --- Main CVDocument export ---
export default function CVDocument({ data, config }: Props) {
  const styles = useMemo(
    () => makeStyles(config.primaryColor, config.accentColor),
    [config.primaryColor, config.accentColor]
  );

  return (
    <Document title={`${data.staff.name} — CV`} author="CV Generator">
      <Page size="A4" style={styles.page}>
        <HeaderSection data={data} styles={styles} />
        {config.baseLayout === 'one-column' ? (
          <OneColumnLayout data={data} config={config} styles={styles} />
        ) : null}
        {config.baseLayout === 'two-column' ? (
          <TwoColumnLayout data={data} config={config} styles={styles} />
        ) : null}
        {config.baseLayout === 'three-column' ? (
          <ThreeColumnLayout data={data} config={config} styles={styles} />
        ) : null}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>{(data.staff.name || '').toUpperCase()} — PROFESSIONAL CV</Text>
          <Text style={styles.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
