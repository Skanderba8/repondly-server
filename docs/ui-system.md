# UI & Styling Context
- **System**: Tailwind CSS + Radix UI / Shadcn.
- **Location**: `packages/ui`.
- **Rules**:
  - Do NOT write custom CSS or inline styles. Use Tailwind utility classes.
  - Use `cn()` utility for conditional classes (`clsx` + `tailwind-merge`).
  - Use CSS variables for theming (e.g., `bg-primary`, not `bg-blue-600`).