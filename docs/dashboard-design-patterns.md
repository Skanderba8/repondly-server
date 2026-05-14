# Repondly Dashboard Design Patterns

This document documents the UI/UX design patterns used in the Repondly dashboard, based on the Donezo design system.

## Color System

### Primary Colors
- **Page Background**: `#F1F5F9` (Slate-100)
- **Card Background**: `#FFFFFF` (White)
- **Sidebar Background**: `#0F172A` (Slate-900)
- **Primary Accent**: `#2563EB` (Blue-600)

### Text Colors
- **Text Primary**: `#0F172A` (Slate-900)
- **Text Secondary**: `#64748B` (Slate-500)
- **Muted**: `#94A3B8` (Slate-400)

### Status Colors
- **Success**: `#22C55E` (Green-500)
- **In Progress**: `#3B82F6` (Blue-500)
- **Pending**: `#F59E0B` (Amber-500)
- **Error**: `#EF4444` (Red-500)

### Border & Utility
- **Border**: `#E2E8F0` (Slate-200)
- **Border Mid**: `#CBD5E1` (Slate-300)

### Card Stat Accents (Top Border)
- **Conversations**: `#2563EB` (Blue-600)
- **Messages**: `#0D9488` (Teal-600)
- **Canaux**: `#22C55E` (Green-500)
- **Automatisation**: `#7C3AED` (Violet-600)

### Channel Colors
- **WhatsApp**: `#22C55E` (Green-500) with badge background `#F0FDF4` (Green-50) and text `#16A34A` (Green-600)
- **Facebook**: `#3B82F6` (Blue-500) with badge background `#EFF6FF` (Blue-50) and text `#2563EB` (Blue-600)
- **Instagram**: `#EC4899` (Pink-500) with badge background `#FDF2F8` (Pink-50) and text `#DB2777` (Pink-600)

### Utility Variants
- **Blue Light**: `#EFF6FF` (Blue-50)
- **Blue Hover**: `#DBEAFE` (Blue-100)
- **Green Light**: `#F0FDF4` (Green-50)
- **Pink Light**: `#FDF2F8` (Pink-50)

## Typography

### Font Sizes
- **Small caps labels**: 11px, uppercase, letter-spacing 0.1em
- **Card labels**: 13px, bold/700
- **Card subtitles**: 12px, muted
- **KPI numbers**: 48px, bold/800
- **Section headers**: 16px, bold/700
- **Body text**: 13-14px

### Font Weights
- **Bold headings**: 700-800
- **Medium emphasis**: 600
- **Body text**: 400-500

## Spacing

### Card Padding
- **Standard cards**: 20px padding
- **Compact cards**: 16px padding
- **Topbar**: 0 24px (desktop), 0 16px (mobile)

### Gaps
- **Card grid gaps**: 16px
- **Section gaps**: 20px
- **Element gaps**: 8-12px

### Border Radius
- **Cards**: 16px (rounded-2xl)
- **Buttons**: 999px (rounded-full/pill)
- **Badges**: 999px (rounded-full/pill)
- **Small elements**: 8-12px

## Shadows

### Card Shadows
- **Standard**: `0 1px 3px rgba(0,0,0,0.08)`
- **Hover**: `0 4px 12px rgba(0,0,0,0.1)`

### Sidebar
- **Background**: `#0F172A` (Slate-900)
- **Hover**: `#1E293B` (Slate-800)

## Components

### Cards

#### Standard Card
```tsx
<div style={{
  background: C.cardBg,
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  padding: '20px',
}}>
  {/* Content */}
</div>
```

#### KPI Card
- White background, rounded-2xl, shadow
- Top border: 3px solid accent color
- Label: small caps, muted
- Icon: top-right in accent color
- Value: 48px, bold
- Subtitle: muted below value
- CTA: pill button, background `#EFF6FF`, text `#2563EB`

### Buttons

#### Primary Action Button (Pill)
```tsx
<button style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 12px',
  borderRadius: 999,
  background: C.blueLight,
  color: C.primary,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s',
}}>
  Label <ArrowRight size={12} />
</button>
```

#### Outlined Button (Pill)
```tsx
<button style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 12px',
  borderRadius: 999,
  background: 'none',
  color: C.primary,
  border: `1px solid ${C.primary}`,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s',
}}>
  Label <ArrowRight size={12} />
</button>
```

### Badges

#### Status Badge (Pill)
```tsx
<span style={{
  fontSize: 12,
  fontWeight: 600,
  color: C.greenText,
  background: C.greenLight,
  padding: '2px 10px',
  borderRadius: 999,
}}>
  Opérationnel
</span>
```

#### Channel Badge
```tsx
<span style={{
  fontSize: 10,
  fontWeight: 700,
  color: channel.badgeText,
  background: channel.badgeBg,
  padding: '2px 8px',
  borderRadius: 999,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}}>
  ACTIF
</span>
```

### Navigation

#### Sidebar Section Label
```tsx
<div style={{
  fontSize: 11,
  fontWeight: 700,
  color: C.mid,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '0 16px',
  marginTop: 24,
  marginBottom: 8,
}}>
  SECTION LABEL
</div>
```

#### Sidebar Nav Item
```tsx
<button style={{
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 16px',
  borderRadius: 8,
  background: active ? C.sidebarHover : 'transparent',
  color: active ? C.white : C.muted,
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  textAlign: 'left',
  borderLeft: active ? `3px solid ${C.primary}` : '3px solid transparent',
}}>
  <span style={{ color: active ? C.primary : 'inherit' }}>{icon}</span>
  <span style={{ flex: 1 }}>{label}</span>
</button>
```

### Filter Tabs

```tsx
{['all', 'unread', 'pending', 'resolved'].map((tab) => (
  <button
    key={tab}
    style={{
      padding: '4px 14px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      background: filterTab === tab ? C.primary : C.bg,
      color: filterTab === tab ? '#fff' : C.textSecondary,
      transition: 'background 0.15s',
    }}
  >
    {tabLabel}
  </button>
))}
```

## Layout Patterns

### Dashboard Grid Structure
```
[Topbar - full width]
[Quick Actions Bar - full width]
[Stat Cards Row - 4 columns]
[Performance Card (60%) | Mise en Service Card (40%)]
[Activité Récente (60%) | Statut Système Card (40%)]
[Canaux de Messagerie - full width]
[AI Bot Activity Widget - full width]
```

### Two-Column Layout
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
  <div style={{ /* Left column content */ }} />
  <div style={{ /* Right column content */ }} />
</div>
```

### Four-Column Grid
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
  {/* 4 cards */}
</div>
```

## Animations

### Mount Animations
- **Stat cards**: fade-in + translateY(10px) to 0, staggered 0.05s each, 300ms ease-out
- **Quick actions bar**: fade-in 200ms on mount
- **Activité Récente rows**: slide in from left, staggered 0.03s, 250ms ease-out
- **Channel cards**: fade-in staggered 0.04s
- **Progress bars**: width animate from 0, 500ms ease-out

### Hover Transitions
- **All hover transitions**: 200ms ease
- **Sidebar items**: background + color transition 150ms ease

### Status Dots
- **Pulse animation**: 2s infinite, ease-in-out
```tsx
<motion.span
  animate={{ opacity: [1, 0.5, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
  style={{ width: 8, height: 8, borderRadius: '50%', background: C.success }}
/>
```

### Chart Animations
- **Sparkline draw**: left to right, 600ms ease-out
```tsx
<motion.polyline
  points={points}
  fill="none"
  stroke={C.primary}
  strokeWidth={2}
  strokeLinecap="round"
  strokeLinejoin="round"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
/>
```

## Responsive Behavior

### Mobile (< 768px)
- Sidebar: hidden, replaced with bottom navigation
- Topbar: simplified with logo
- Padding: reduced to 16px
- Grid layouts: stack to single column
- Bottom nav: 66px height, fixed position

### Desktop (>= 768px)
- Sidebar: visible, 200px width
- Topbar: full with user info
- Padding: 24px horizontal
- Grid layouts: as specified

## Icon Usage

### Icon Sizes
- **KPI card icons**: 18px
- **Button icons**: 12-16px
- **Status dots**: 8-10px
- **Navigation icons**: 16px

### Icon Library
- Using `lucide-react` for all icons
- Common icons: `LayoutDashboard`, `Inbox`, `Radio`, `Calendar`, `Bot`, `Settings`, `MessageSquare`, `TrendingUp`, `Wifi`, `Zap`, `ArrowRight`, `User`, `LogOut`, `RefreshCw`, `CheckCircle`

## French Text Guidelines

- All UI text must remain in French
- Use proper French typography (accents, spaces)
- Common terms:
  - "Accueil" (Home)
  - "Messagerie" (Messaging)
  - "Canaux" (Channels)
  - "Calendrier" (Calendar)
  - "Agent IA" (AI Agent)
  - "Paramètres" (Settings)
  - "Opérationnel" (Operational)
  - "En attente" (Pending)
  - "Résolus" (Resolved)

## Mock Data Guidelines

All mock data sections must include `// TODO: wire to real API` comments:
```tsx
// TODO: wire to real API
const metrics = [
  { label: 'Taux de résolution', value: '87%', color: '#22C55E' },
  // ...
]
```

## Implementation Notes

- All styles use inline styles (no Tailwind classes)
- All animations use `framer-motion`
- All components are in a single file (`DashboardShell.tsx`)
- No component splitting (as per requirements)
- Keep all logic, routing, data, and French text intact when making style changes
