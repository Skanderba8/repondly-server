# Frontend Design System

This document defines the design system and UI guidelines for Répondly dashboard application, applicable to both web and PWA (Progressive Web App) implementations.

## Core Design Philosophy

The Répondly UI uses a **layered depth system** where every component exists on its own physical plane through frosted glass effects, translucency, and light simulation. This creates a modern, professional aesthetic with perceived depth without 3D transforms.

## Global Background

- **Gradient**: Light indigo/periwinkle radial gradient
- **Values**: `#EEF2FF` to `#E0E7FF` at edges fading to `#F8FAFF` at center
- **Implementation**: Applied to `html, body` in `layout.tsx` and main container in `DashboardShell.tsx`
- **Purpose**: Creates a subtle tinted floor that all glass layers sit on top of

## Depth Layering System

### Depth Tokens

All depth tokens use semi-transparent whites with varying opacity to create perceived depth:

- **`depth1`**: `rgba(255, 255, 255, 0.92)` - Base surface layer
- **`depth2`**: `rgba(255, 255, 255, 0.85)` - Cards, panels, buttons
- **`depth3`**: `rgba(255, 255, 255, 0.75)` - List items, badges, nested elements
- **`depth4`**: `rgba(255, 255, 255, 0.65)` - Deep nested elements

### Effects

- **`innerGlow`**: `inset 0 1px 0 rgba(255, 255, 255, 0.4)` - Top edge light simulation
- **`blueShadow`**: `0 8px 32px rgba(30, 27, 75, 0.15)` - Blue-tinted shadow for depth
- **`recessed`**: `inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)` - Pressed-in effect

### Backdrop Blur

- Standard blur: `blur(16px)` - Most components
- Enhanced blur: `blur(24px)` - Panels, backgrounds
- Deep blur: `blur(32px)` - Navbar, floating elements

### Borders

- Glass border: `1px solid rgba(255, 255, 255, 0.3)` - Translucent white borders
- Colored borders: Used for active states with channel colors

## Component Guidelines

### Conversation List Items

- **Background**: `depth3` (inactive), `depth2` (active)
- **Effects**: `backdropFilter: blur(16px)`, `innerGlow`, `blueShadow`
- **Border**: Hairline top border `1px solid rgba(255, 255, 255, 0.5)`
- **Hover**: Transition to `depth2`

### Message Bubbles

- **Outgoing**: `rgba(26, 86, 219, 0.95)` - Solid colored glass
- **Incoming**: `depth3` with `backdropFilter: blur(20px)`, `innerGlow`, `blueShadow`
- **Border**: Glass border for incoming, none for outgoing

### Status Badges (En attente / Résolues)

- **Background**: `depth3`
- **Effects**: `backdropFilter: blur(16px)`, `innerGlow`, `blueShadow`
- **Border**: Colored border based on status
  - Résolue: `1px solid rgba(14, 164, 114, 0.3)`
  - En attente: `1px solid rgba(26, 86, 219, 0.3)`

### Segmented Controls & Filter Chips

- **Active state**: `depth2` with `innerGlow`, `blueShadow`
- **Inactive state**: `depth3` with `recessed` effect
- **Blur**: `blur(24px)`

### Buttons

- **Background**: `depth2`
- **Effects**: `backdropFilter: blur(16px)`, `innerGlow`, `blueShadow`
- **Hover**: Transition to `depth3`
- **Purpose**: Raised physical key feel

### Panels (Conversation List, Chat Background)

- **Background**: `depth1`
- **Effects**: `backdropFilter: blur(24px)`, `innerGlow`, `blueShadow`
- **Purpose**: Layered frosted panel sitting on gradient

### Navbar / Sidebar

- **Background**: `depth2`
- **Effects**: `backdropFilter: blur(32px)`, `innerGlow`, `blueShadow`
- **Purpose**: Deeper glass effect to feel hovering

### KPI Cards & Channel Cards

- **Background**: `depth2`
- **Effects**: `backdropFilter: blur(20px)`, `innerGlow`, `blueShadow`
- **Hover**: Enhanced shadow `0 12px 40px rgba(30, 27, 75, 0.2)`

### Channel Icons (Badges)

- **Background**: `depth2`
- **Effects**: `backdropFilter: blur(16px)`, `innerGlow`, `blueShadow`
- **Border**: `1px solid rgba(255, 255, 255, 0.4)`

### User Avatar

- **Background**: `depth2`
- **Effects**: `backdropFilter: blur(16px)`, `innerGlow`, `blueShadow`
- **Border**: `1px solid rgba(255, 255, 255, 0.3)` (inactive), `2px solid primary` (active)

## Color Palette

### Primary Colors

- **Primary**: `#1A56DB` - Main blue
- **Success**: `#0EA472` - Green
- **Error**: `#EF4444` - Red
- **Warning**: `#F59E0B` - Orange
- **Info**: `#1A56DB` - Blue

### Channel Colors

- **WhatsApp**: `#22C55E`
- **Facebook**: `#3B82F6`
- **Instagram**: `#EC4899`

### Text Colors

- **Primary**: `#0F172A` - Main text
- **Secondary**: `#475569` - Labels, descriptions
- **Tertiary**: `#64748B` - Muted text

### Borders

- **Border**: `rgba(0, 0, 0, 0.08)` - Standard border
- **Border Light**: `rgba(255, 255, 255, 0.2)` - Glass borders

## Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Display Font**: DM Serif Display (for logo)

### Font Sizes

- **Labels**: 10-11px (uppercase, tracking 0.08em)
- **Body**: 13-14px
- **Headings**: 15-18px
- **KPI Values**: 44px

### Font Weights

- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Corner Radii

- **Surface**: 24px
- **Card**: 16px
- **Input**: 12px
- **Pill**: 999px
- **Bubble**: 20px

## Spacing

- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 20px
- **2XL**: 24px

## Animation Guidelines

### Transitions

- **Fast**: 0.12s - Dropdowns, tooltips
- **Standard**: 0.15s - Buttons, hover states
- **Smooth**: 0.2s - Cards, panels
- **Slow**: 0.25s - Segmented controls

### Spring Animations (Framer Motion)

- **Stiffness**: 300
- **Damping**: 25 (standard), 30 (sidebar)

### Motion Effects

- **Cards/Items**: Initial opacity 0, y 10
- **Modals**: Initial scale 0.95, opacity 0
- **Sidebar**: Initial x -100%

## PWA-Specific Considerations

### Safe Areas

- iOS PWA requires safe area insets for notched devices
- Use `env(safe-area-inset-top)` for header spacing
- Use `env(safe-area-inset-bottom)` for footer spacing
- Match safe area background with header background

### Touch Targets

- Minimum touch target size: 44x44px (iOS)
- Minimum touch target size: 48x48px (Android Material)
- Ensure all interactive elements meet these minimums

### Performance

- Use `backdrop-filter` sparingly on mobile devices
- Consider disabling blur on low-end devices via media queries
- Test performance on target devices

### Viewport Configuration

```typescript
// In layout.tsx
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

## Implementation Rules

### DO

- Use depth tokens for all backgrounds
- Apply backdrop-filter blur to glass elements
- Add innerGlow to top edges of raised elements
- Use blueShadow for depth perception
- Maintain consistent blur levels across similar components
- Test contrast ratios for accessibility
- Use translucent borders on glass elements

### DON'T

- Use flat white backgrounds (#FFFFFF)
- Use colored gradients on individual components
- Use grey or black shadows (use blue-tinted only)
- Add bottom edge glows (light source from above only)
- Skip backdrop-filter on glass elements
- Mix depth levels inconsistently

## File Locations

### Design Tokens

- `dashboard-app/src/app/dashboard/DashboardShell.tsx` - Main dashboard tokens
- `dashboard-app/src/app/dashboard/messagerie/MessagerieView.tsx` - Messaging tokens

### Component Styling

- Components should use the depth tokens from parent file's C object
- Copy depth tokens to new component files as needed
- Maintain consistency across all dashboard pages

## Future Enhancement Guidelines

When adding new UI components or enhancing existing ones:

1. **Apply depth layering**: Use appropriate depth token based on component hierarchy
2. **Add glass effects**: Include backdrop-filter blur and appropriate shadow
3. **Maintain consistency**: Follow the patterns established for similar components
4. **Test on both web and PWA**: Ensure safe areas and touch targets work correctly
5. **Update this document**: Document any new patterns or exceptions

## Accessibility

### Contrast Ratios

- Primary text on glass: > 4.5:1 (WCAG AA)
- Secondary text on glass: > 3:1 (WCAG AA large text)
- Interactive elements: > 3:1 contrast

### Focus States

- All interactive elements must have visible focus states
- Use 2px primary color border for focus
- Ensure keyboard navigation works throughout

### Screen Readers

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure color is not the only indicator of state

## Browser Compatibility

### backdrop-filter

- Chrome/Edge: Full support
- Safari: Full support (iOS 9+, macOS)
- Firefox: Full support (v103+)
- Fallback: Consider solid backgrounds for older browsers

### CSS Grid/Flexbox

- Full modern browser support
- No fallbacks needed for target browsers

## Version History

- **v1.0** (2026-05-15): Initial depth layering system implementation
  - Added depth tokens (depth1-depth4)
  - Implemented glass effects across all components
  - Updated color palette for better contrast
  - Documented design system for web and PWA
