# Agent Rules & Guidelines

When working on UI components or pages in this project, you must adhere to the following rules regarding component creation:

## 1. Prioritize shadcn/ui Components

Do **NOT** build UI components or primitives from scratch if a corresponding component is available in the shadcn/ui library. Always prioritize using shadcn/ui components to maintain design consistency and speed.

## 2. Check for Existing Components First

Before implementing a UI element, inspect the `apps/frontend/src/components/ui/` directory to see if the required component has already been installed in the project.

- Existing components include: `button`, `card`, `input`, `select`, `badge`, `avatar`, `dialog`, `toast`, `separator`, `skeleton`, `tabs`, `dropdown-menu`, `tooltip`, `alert-dialog`, `switch`, etc.

## 3. Install Missing shadcn Components

If the required component does not exist in `apps/frontend/src/components/ui/`, you **must** download and install it using the shadcn CLI before writing any custom UI code.

- To download/install a component, run:
  ```bash
  npx shadcn@latest add <component-name>
  ```
  _(Note: Run this command in the `apps/frontend/` directory where `components.json` is located.)_

## 4. When to Build from Scratch

You should only build a UI component from scratch if:

1. The component or utility does not exist in the shadcn/ui catalog.
2. The specific layout, functional requirement, or styling cannot be reasonably achieved by composing or extending existing shadcn/ui primitives.

## 5. Design & Styling Consistency

- All shadcn/ui components and custom styling should integrate seamlessly with the Tailwind CSS v4 design system and the CSS theme variables defined in `apps/frontend/src/index.css`.
- Ensure that accessibility standards (ARIA attributes, keyboard navigation) are preserved when customizing shadcn/ui primitives.

## 6. Package Installation Policy (pnpm)

This project is a monorepo managed via `pnpm` workspaces. You **must** use `pnpm` for any package/dependency installations or running any scripts. Do **NOT** use `npm`, `yarn`, or `bun`.
- To add a package to a specific workspace/app (e.g. frontend):
  ```bash
  pnpm --filter frontend add <package-name>
  ```
- To install all workspace dependencies:
  ```bash
  pnpm install
  ```
- To run a script:
  ```bash
  pnpm <script-name>
  ```

