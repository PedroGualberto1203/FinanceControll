---
name: ui-ux-pro-max
description: "Project-local frontend UI/UX design intelligence adapted from nextlevelbuilder/ui-ux-pro-max-skill for Codex. Use when designing, building, reviewing, refactoring, or improving frontend interfaces, landing pages, dashboards, admin panels, SaaS screens, mobile/web app UI, components, design systems, color palettes, typography, layout, motion, accessibility, responsive behavior, Tailwind/shadcn-style styling, charts, forms, navigation, or visual quality checks."
---

# UI/UX Pro Max

Use this project-local Codex skill for frontend work that changes how an interface looks, feels, moves, or is interacted with. It bundles the UI/UX Pro Max searchable design database and design-system generator from `nextlevelbuilder/ui-ux-pro-max-skill`, adapted for `.codex/skills/ui-ux-pro-max`.

## Codex Adaptation

- Use local paths under `.codex/skills/ui-ux-pro-max`; do not use `~/.claude`, `.claude`, Claude slash commands, or Claude-specific `AskUserQuestion` flows.
- Treat the scripts and CSV data as recommendation engines, not as mandatory dependencies for the product runtime.
- Do not add frontend packages just because this skill mentions them. Reuse the project's existing stack and dependencies unless the user explicitly approves new ones.
- If Python is not on PATH, use the bundled Codex Python runtime when available.

## Core Workflow

1. Inspect the current frontend stack before making UI changes.
2. For any new page, major component, dashboard, visual redesign, or product-level UI direction, generate a design system first.
3. Supplement with focused searches for style, color, typography, UX, chart, product, landing, or stack guidance as needed.
4. Implement using the existing project patterns, converting recommendations into real tokens, components, layout, and accessibility behavior.
5. Verify visual quality, responsiveness, interaction states, and accessibility before delivery.

## Search Commands

Use the local search script:

```powershell
& "<python-executable>" .codex\skills\ui-ux-pro-max\scripts\search.py "<query>" --design-system -p "FinanceControll"
```

If `python` or `python3` is available:

```powershell
python .codex\skills\ui-ux-pro-max\scripts\search.py "personal finance dashboard fintech" --design-system -p "FinanceControll"
```

Use Markdown output when the result should become durable documentation:

```powershell
python .codex\skills\ui-ux-pro-max\scripts\search.py "personal finance dashboard fintech" --design-system -f markdown -p "FinanceControll"
```

Persist a project design system only when a durable source of truth is useful:

```powershell
python .codex\skills\ui-ux-pro-max\scripts\search.py "personal finance dashboard fintech" --design-system --persist -p "FinanceControll"
```

This writes `design-system/financecontroll/MASTER.md` and optional page overrides under `design-system/financecontroll/pages/`.

## Focused Queries

After the design-system pass, use focused searches only for the decision at hand:

```powershell
python .codex\skills\ui-ux-pro-max\scripts\search.py "financial dashboard trust clarity" --domain product
python .codex\skills\ui-ux-pro-max\scripts\search.py "fintech accessible palette" --domain color
python .codex\skills\ui-ux-pro-max\scripts\search.py "dashboard dense data readable" --domain typography
python .codex\skills\ui-ux-pro-max\scripts\search.py "forms validation accessibility" --domain ux
python .codex\skills\ui-ux-pro-max\scripts\search.py "cashflow trend comparison" --domain chart
python .codex\skills\ui-ux-pro-max\scripts\search.py "responsive layout" --stack react
```

Available domains: `product`, `style`, `color`, `typography`, `landing`, `chart`, `ux`, `react`, `web`, `icons`, `google-fonts`.

Available stacks: `react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `nuxtjs`, `nuxt-ui`, `html-tailwind`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`.

## Frontend Quality Rules

- Pick a deliberate visual direction before coding: product type, target user, mood, density, typography, and palette.
- Define semantic design tokens for colors, surfaces, text, borders, radius, spacing, shadow, and motion before scattering raw values.
- Preserve the project's existing design system when one exists; use this skill to refine it, not overwrite it casually.
- Avoid generic AI defaults: no purple-on-white autopilot, no emoji structural icons, no interchangeable SaaS cards unless they serve the product.
- Use vector icons from the project's existing icon family. If none exists, recommend one consistent family rather than mixing sources.
- Design mobile-first and verify at 375px, 768px, 1024px, and 1440px when applicable.
- Keep normal text contrast at least 4.5:1 and non-text UI contrast at least 3:1.
- Provide visible hover, focus, active, disabled, loading, empty, success, and error states.
- Respect `prefers-reduced-motion`; keep meaningful UI motion mostly in the 150-300ms range.
- For charts, provide legends, labels/tooltips, accessible color choices, and a textual summary when the chart conveys key information.

## Pre-Delivery Checklist

- Design-system or focused search was run for non-trivial UI work, or there is a clear reason it was not needed.
- UI uses semantic tokens and existing components where possible.
- Layout works on mobile and desktop without horizontal scroll.
- Keyboard focus order and focus visibility are intact.
- Interactive elements have appropriate labels, roles, target sizes, and feedback states.
- Loading, empty, error, and disabled states are handled.
- Visual changes were checked in a browser or equivalent renderer when a local target is available.
