---
name: ui-ux-pro-max
description: "Project-local frontend UI/UX design intelligence adapted from nextlevelbuilder/ui-ux-pro-max-skill for Codex. Use when designing, building, reviewing, refactoring, or improving frontend interfaces, dashboards, admin panels, SaaS screens, mobile/web app UI, components, design systems, color palettes, typography, layout, motion, accessibility, responsive behavior, Tailwind/shadcn-style styling, charts, forms, navigation, or visual quality checks."
---

# UI/UX Pro Max

Use this project-local Codex skill for frontend work that changes how an interface looks, feels, moves, or is interacted with. It bundles the UI/UX Pro Max searchable design database and design-system generator from `nextlevelbuilder/ui-ux-pro-max-skill`, adapted for `.codex/skills/ui-ux-pro-max`.

## Codex Adaptation

- Use local paths under `.codex/skills/ui-ux-pro-max`.
- Treat scripts and CSV data as recommendation engines, not as product runtime dependencies.
- Reuse this project's existing stack unless the user explicitly approves a new runtime dependency.
- If `python` is not on PATH, use the bundled Codex Python runtime.
- Keep generated design decisions in `design-system/financecontroll/MASTER.md` when a durable source of truth is useful.

## Core Workflow

1. Inspect the current frontend stack before making UI changes.
2. For any major visual redesign, generate a design system first.
3. Run focused searches for style, color, typography, UX, chart, product, icons, or stack guidance as needed.
4. Implement with the existing project patterns, converting recommendations into real tokens, components, layout, and accessibility behavior.
5. Verify visual quality, responsiveness, interaction states, and accessibility before delivery.

## Search Commands

Use the local search script:

```powershell
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "<query>" --design-system -p "FinanceControll"
```

Persist a project design system:

```powershell
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "<query>" --design-system --persist -p "FinanceControll"
```

Focused searches:

```powershell
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "fintech accessible palette" --domain color
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "dark drawer yellow accent dashboard" --domain style
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "dashboard navigation icons" --domain icons
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "forms validation accessibility" --domain ux
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "responsive layout" --stack html-tailwind
```

Available domains include `product`, `style`, `color`, `typography`, `landing`, `chart`, `ux`, `react`, `web`, `icons`, and `google-fonts`.

Available stacks include `html-tailwind`, `react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `nuxtjs`, `nuxt-ui`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, and `laravel`.

## Frontend Quality Rules

- Pick a deliberate visual direction before coding: product type, target user, mood, density, typography, and palette.
- Define semantic design tokens for colors, surfaces, text, borders, radius, spacing, shadow, and motion before scattering raw values.
- Preserve the project's existing design system when one exists; use this skill to refine it.
- Avoid generic AI defaults: no purple-on-white autopilot, no emoji structural icons, and no interchangeable SaaS cards unless they serve the product.
- Use vector icons from the project's existing icon family.
- Design mobile-first and verify at 375px, 768px, 1024px, and 1440px when applicable.
- Keep normal text contrast at least 4.5:1 and non-text UI contrast at least 3:1.
- Provide visible hover, focus, active, disabled, loading, empty, success, and error states.
- Respect `prefers-reduced-motion`; keep meaningful UI motion mostly in the 150-300ms range.
- For charts, provide legends, labels/tooltips, accessible color choices, and a textual summary when the chart conveys key information.

## Pre-Delivery Checklist

- Design-system or focused search was run for non-trivial UI work.
- UI uses semantic tokens and existing components where possible.
- Layout works on mobile and desktop without horizontal scroll.
- Keyboard focus order and focus visibility are intact.
- Interactive elements have appropriate labels, roles, target sizes, and feedback states.
- Loading, empty, error, and disabled states are handled.
- Visual changes were checked in a browser or equivalent renderer when a local target is available.
