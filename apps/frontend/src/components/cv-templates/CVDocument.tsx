// IMPORTANT: @react-pdf/renderer is ONLY imported in this file.
// All other files that need PDF rendering must lazy-load this component.
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import type { CVData, TemplateConfig, SectionConfig } from '@cv-generator/shared';

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
      {staff.photoUrl && (
        <Image style={styles.headerPhoto} src={staff.photoUrl} />
      )}
      <View>
        <Text style={styles.headerName}>{staff.name}</Text>
        <Text style={styles.headerTitle}>{staff.jobTitle}</Text>
        <Text style={styles.headerYears}>{staff.yearsExperience} years of experience</Text>
      </View>
    </View>
  );
}

function SummarySection({ data, label, styles }: { data: CVData; label: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>{label}</Text>
      <Text style={styles.summaryText}>{data.staff.summary}</Text>
    </View>
  );
}

function SkillsSection({ data, label, styles }: { data: CVData; label: string; styles: ReturnType<typeof makeStyles> }) {
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

function ExperienceSection({ data, label, styles }: { data: CVData; label: string; styles: ReturnType<typeof makeStyles> }) {
  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'Present';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <View>
      <Text style={styles.sectionHeading}>{label}</Text>
      {data.participations.map((p) => (
        <View key={p.id} style={styles.expCard}>
          <Text style={styles.expProject}>{p.project.name}</Text>
          <Text style={styles.expMeta}>
            {p.project.client} · {p.project.location} · {formatDate(p.project.startDate)} — {formatDate(p.project.endDate)}
          </Text>
          <Text style={styles.expRole}>{p.role}</Text>
          <Text style={styles.expDesc}>{p.responsibilities}</Text>
          <View style={styles.techWrap}>
            {(p.project.technologies as string[]).map((t) => (
              <Text key={t} style={styles.techChip}>{t}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function CustomSection({ section, styles }: { section: SectionConfig; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>{section.label}</Text>
      {section.content && <Text style={styles.customText}>{section.content}</Text>}
    </View>
  );
}

// --- Layout renderers ---
function renderSection(section: SectionConfig, data: CVData, styles: ReturnType<typeof makeStyles>) {
  switch (section.id) {
    case 'summary':
      return <SummarySection key={section.id} data={data} label={section.label} styles={styles} />;
    case 'skills':
      return <SkillsSection key={section.id} data={data} label={section.label} styles={styles} />;
    case 'experience':
      return <ExperienceSection key={section.id} data={data} label={section.label} styles={styles} />;
    case 'custom':
      return <CustomSection key={`custom-${section.order}`} section={section} styles={styles} />;
    default:
      return null;
  }
}

function OneColumnLayout({ data, config, styles }: { data: CVData; config: TemplateConfig; styles: ReturnType<typeof makeStyles> }) {
  const sections = config.sections
    .filter((s) => s.visible && s.id !== 'header')
    .sort((a, b) => a.order - b.order);

  return (
    <View style={styles.fullCol}>
      {sections.map((s) => renderSection(s, data, styles))}
    </View>
  );
}

function TwoColumnLayout({ data, config, styles }: { data: CVData; config: TemplateConfig; styles: ReturnType<typeof makeStyles> }) {
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
      <View style={styles.mainCol}>
        {mainSections.map((s) => renderSection(s, data, styles))}
      </View>
    </View>
  );
}

function ThreeColumnLayout({ data, config, styles }: { data: CVData; config: TemplateConfig; styles: ReturnType<typeof makeStyles> }) {
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
