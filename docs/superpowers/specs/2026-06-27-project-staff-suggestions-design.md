# Project Staff Suggestions Design

## Overview
This feature introduces a "Staff Suggestions" mechanism to the project creation/edit form. When a user inputs a list of technologies for a project, they can click a button to view a list of recommended staff members whose skills match those technologies.

## 1. API & Backend Data Flow

### Endpoint
- **Route**: `POST /staff/suggestions`
- **Request Body**: 
  ```json
  {
    "technologies": ["React", "Node.js"]
  }
  ```
- **Response Payload**: Array of staff members along with their matching skills.
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "Jane Doe",
        "jobTitle": "Senior Frontend Developer",
        "matchedSkills": ["React"]
      }
    ]
  }
  ```

### Database Query Logic
- `StaffService` will query the database to find staff who have at least one skill where `name` (case-insensitive) is in the provided `technologies` array.
- The results will be aggregated on the backend and sorted in descending order based on the count of matched skills.
- The response will include a `matchedSkills` array for each suggested staff member to give context to the UI.

## 2. Frontend Layout & UI

### Page Layout Updates
- `ProjectFormPage.tsx` will be refactored from a single-column container into a two-column CSS grid (e.g., `grid-cols-1 lg:grid-cols-3` or `grid-cols-[1fr_300px]`).
- The main project form will occupy the left column (spanning 2 columns on large screens).
- A new `StaffSuggestionsCard` component will sit in the right column. It will be made "sticky" so it remains visible while scrolling down the long form.

### Triggering Suggestions
- A button labeled **"Show Staff Suggestions"** will be added to the form, positioned either near the "Technologies" input section or immediately above the "Assigned Staff" section.
- Clicking the button will trigger a mutation or lazy query using React Query (`useStaffSuggestions`) that hits the `POST /staff/suggestions` endpoint with the currently active technologies from the form.

### Staff Suggestions Card
- A sidebar component that displays the returned recommendations.
- **Empty State**: If the user hasn't searched yet, or if there are no matches, it will display a friendly placeholder message.
- **List Items**: Each recommended staff member will be displayed as a row containing:
  - **Name & Job Title**
  - **Matched Skills**: Displayed as small, highlighted badges.
  - **Action Button**: A small `+` (Add) button.
- **Interaction**: Clicking the `+` button will use React Hook Form's `append` (from `useFieldArray`) to add the staff member to the `participations` array in the main form, pre-filling the `staffId`. The user can then type in the specific "Role" and "Responsibilities".

## Security & Validation
- Standard authorization applies to the suggestions endpoint (requires authenticated staff/admin).
- Zod schema validation will ensure `technologies` is an array of strings.

## Scope
This design is fully scoped to this single feature. No major refactoring of unrelated backend logic is required, and the generic `GET /staff` endpoint is left untouched.
