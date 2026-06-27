---
name: GISCON CV Generator
description: A softer, modern staff CV manager and A4-compatible tender CV builder.
colors:
  background: "#f8f9fa"
  foreground: "#1a1f26"
  primary: "#1d2e3d"
  secondary: "#edf0f2"
  muted: "#ebedf0"
  accent: "#2e74c8"
  destructive: "#c9252d"
  success: "#269356"
  warning: "#caa228"
  border: "#dce1e6"
  input: "#dce1e6"
  ring: "#2e74c8"
  card: "#ffffff"
  sidebar: "#14212a"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: GISCON CV Generator

## 1. Overview

**Creative North Star: "The Architect's Ledger"**

The Architect's Ledger is a visual system built around alignment, soft visual grids, generous vertical rhythm, and publication-quality typography. Rather than boxy modules or heavy visual separations, it structures information through subtle tonal bands, thoughtful negative space, and clear typography sizes. It respects content first—making dense lists of staff profiles, skills, and projects easy to browse online and perfectly legible in physical print.

Key Characteristics:
- **Tonal Depth**: Content containers use background-color shifts (`#ffffff` surfaces on `#f8f9fa` backgrounds) instead of heavy shadows or borders.
- **Strict A4 Integrity**: Every printable element is optimized for page boundaries, eliminating layout overflow and using black-and-white media rules.
- **Sincere Polish**: High attention to interactive state transitions (hover, active, focus) and error messages.

## 2. Colors

A quiet, professional color palette designed for high contrast and readability, prioritizing deep slate ink and clean paper tones.

### Primary
- **Slate Ink** (`#1d2e3d` / `oklch(27% 0.06 250)`): The primary color for sidebars, primary action buttons, and dominant headers. It provides an authoritative base.

### Neutral
- **Chalk White** (`#ffffff` / `oklch(100% 0 0)`): Surface card background and clean panel backgrounds.
- **Cool Alabaster** (`#f8f9fa` / `oklch(98% 0.005 264)`): The primary application canvas background, creating a softer look to reduce screen glare.
- **Prussian Ash** (`#1a1f26` / `oklch(13% 0.025 264)`): The main text color. High contrast against alabaster and white surfaces.
- **Border Ash** (`#dce1e6` / `oklch(88% 0.01 264)`): Used for subtle separators, grid lines, and input outlines.

### Accent
- **Ocean Breeze** (`#2e74c8` / `oklch(56% 0.18 250)`): High-priority focus outlines, active navigation icons, and key visual highlights.

### Named Rules
**The Silent Anchor Rule.** Accent colors must occupy less than 10% of any layout. The Slate Ink base dominates the page, while the Ocean Breeze accent is used strictly to command attention to interactive anchors.

## 3. Typography

**Display Font:** Inter (sans-serif)
**Body Font:** Inter (sans-serif)
**Label/Mono Font:** ui-sans-serif, system-ui

A clean geometric sans-serif stack that translates perfectly to PDF layout exports.

### Hierarchy
- **Display** (700, `clamp(2rem, 4vw, 3.5rem)`, 1.1): Used for big dashboard summaries and section hero headers. Letter spacing must be at least `-0.02em` to avoid touching characters.
- **Headline** (600, `1.5rem` (24px), 1.25): Major section labels and staff profile titles.
- **Title** (600, `1.25rem` (20px), 1.3): Subsections and list headers.
- **Body** (400, `1rem` (16px), 1.6): Paragraph text, experience descriptions, and project summaries.
- **Label** (500, `0.875rem` (14px), 1.4): Metadata fields, tags, input labels, and sidebar navigation titles.

### Named Rules
**The Ink-Only Rule.** Contrast must not be sacrificed for style. All body copy and list item text must use Prussian Ash. Muted text must maintain a minimum contrast ratio of `4.5:1` against its background container.

## 4. Elevation

The GISCON interface is flat by default. Depth is conveyed using tonal containment and outline borders rather than shadows.

### Named Rules
**The Flat-At-Rest Rule.** All static page elements, tables, list items, and sidebar panels must be flat (zero shadow). Box-shadows are strictly forbidden for layout containers.
**The Overlay Exception Rule.** Shadows are reserved exclusively for float overlays (dropdowns, popover selections, tooltips, dialog backdrops) to establish temporary elevation hierarchy.

## 5. Components

### Buttons
- **Shape:** Gently rounded (`6px` radius).
- **Primary:** Filled with Slate Ink, white text. Transitions to Hover (`oklch(22% 0.07 250)`).
- **Secondary:** Filled with Cool Alabaster, Prussian Ash text, bordered with Border Ash.

### Cards / Containers
- **Corner Style:** Rounded (`8px` radius).
- **Background:** White (`#ffffff`).
- **Shadow Strategy:** Flat at rest, subtle shadow on hover if interactive.

### Inputs / Fields
- **Style:** Outlined with Border Ash, Alabaster background.
- **Focus:** Ocean Breeze outline border and a subtle ring glow.

### Navigation
- **Style:** Flat side nav with Slate Ink background, high-contrast text, active states highlighted with a light secondary background indicator.

## 6. Do's and Don'ts

### Do:
- **Do** format generated CV views for print with `@media print` rules, forcing background elements to clear and converting ink colors to pure black for legibility.
- **Do** keep cards and container corner radius between `6px` and `8px` max.
- **Do** write responsive layout templates that automatically fit standard A4 paper size width limits (max-width `794px` or `21cm`).

### Don't:
- **Don't** use raw, unstyled HTML controls or placeholder lists that look like draft prototypes.
- **Don't** use side-stripe borders as colored accents on lists, cards, or callouts.
- **Don't** use harsh high-contrast black borders or rigid, overly dense tables with no rhythm.
- **Don't** use card grids when flat layouts with padding or background shifts are cleaner.
- **Don't** pair cards with soft drop shadows of more than `8px` blur.
- **Don't** use gradient text under any circumstances.
