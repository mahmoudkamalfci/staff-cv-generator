# Template Wizard Update Design

## Objective
Update the "Create New Template" wizard to remove custom section functionality and allow administrators to rename standard sections.

## Requirements
- **Remove Custom Sections**: Users should no longer be able to add or remove "custom" text sections.
- **Rename Standard Sections**: Administrators should be able to edit the titles of standard sections (e.g., Summary, Skills, Experience).
- **Header Exception**: The "Header" section should remain static and non-editable, as it represents the fixed personal info block and typically does not display a title on the CV itself.

## Architecture & Components

### `Step2Sections.tsx`
- **Removals**: 
  - Remove `addCustom` and `removeCustom` functions.
  - Remove the "Add custom section" `<Button>`.
  - Remove the rendering logic for the custom section `<textarea>` (content).
- **Modifications**:
  - Update the rendering loop over `sorted` sections.
  - For any section where `section.id !== 'header'`, render an inline `<Input>` component bound to `section.label`.
  - For `section.id === 'header'`, render the existing static text `<span>`.
  - The `updateLabel` function will be used to update the label for any standard section as the user types.

## Data Flow
- The `onChange` callback in `Step2Sections` will continue to pass the updated `sections` array up to `TemplateWizardPage`.
- The `TemplateConfig` structure remains unchanged, relying on the standard sections defined in `Step1Base.tsx` (`DEFAULT_SECTIONS`).

## Error Handling & Edge Cases
- **Maximum Length**: We can rely on standard HTML input max lengths if necessary, but typical section titles are short.
- **Empty Titles**: The input should ideally not be entirely empty; we can fall back to the section `id` if the user leaves it blank, or just allow it if they intentionally want no title.

## Scope
This is a focused UI update restricted to `Step2Sections.tsx`. It does not require changes to the backend schema since the `TemplateConfig` already stores `sections` as an array of objects with a `label` property.
