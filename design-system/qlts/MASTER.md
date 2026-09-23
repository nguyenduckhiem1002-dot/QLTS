# QLTS Design System

This is the visual source of truth for QLTS. It is intentionally optimized for an internal, data-heavy asset operations product rather than a marketing dashboard.

## Direction

- Product archetype: enterprise operations console.
- Variance: 4/10. Clear identity without novelty that slows work.
- Motion: 2-3/10. Motion communicates hover, press, loading and route continuity only.
- Density: 8/10. Compact enough for daily operations, never cramped.
- Visual tone: calm, technical, trustworthy, understated.

## Anti-slop rules

- Do not introduce blue/purple gradients, glass cards, oversized pill badges, or generic three-card feature rows.
- Do not use a card for every piece of information. Prefer rows, tables, dividers and one large surface.
- Do not use icons as decoration. Keep icons mainly for navigation and explicit actions.
- Do not use identical KPI cards. Dashboard summary should read as one information composition.
- Do not add GSAP or cinematic motion to operational screens.
- Avoid copywriting clichés. Use direct Vietnamese product language.

## Type

- UI: Geist Sans.
- Codes, serials and important numeric values: Geist Mono.
- Headings use tight tracking and sentence case.
- Data uses tabular figures where possible.

## Color

- Canvas: cool neutral gray.
- Navigation: charcoal navy.
- Surface: white.
- Primary accent: muted operational blue.
- Status colors are semantic and low saturation.
- One accent color only outside semantic status colors.

## Surfaces

- Border radius: 8-12px for containers, 7-9px for controls.
- Shadows are not the default separation mechanism. Prefer borders, spacing and background contrast.
- Status is shown as text + dot rather than pill badges in data tables.

## Interaction

- Minimum interactive height: 40px desktop, 44px on touch layouts.
- Hover/press transitions: 120-200ms.
- Always provide visible :focus-visible styles.
- Respect prefers-reduced-motion.
- Use skeleton loading for route transitions.
- Mobile navigation uses a top rail, not a six-item bottom navigation.

## Layout

- Main content max width around 1460px.
- Dashboard uses one asymmetric overview board, then operational data surfaces.
- Tables are primary UI and should have sticky headers.
- Forms stay in a right-side utility panel on desktop and stack below content on smaller screens.

## Accessibility

- Maintain AA contrast for normal text.
- Inputs require visible labels.
- Search fields have an accessible name independent from placeholder text.
- Icon-only navigation items expose aria-labels.
- Include a skip-to-content link.
