# FinanceControll Design System

Generated from UI/UX Pro Max guidance and project direction on 2026-06-02.

## Direction

FinanceControll is a dark-first personal finance dashboard. The interface should feel like a compact premium control surface: a deep charcoal app canvas, a floating drawer/rail, crisp data cards, and yellow/gold as the primary action and navigation signal.

The visual reference is an inspirational drawer/sidebar style only. Do not copy third-party branding, logos, assets, or product-specific content.

## Tokens

| Role | Value |
| --- | --- |
| Background | `#06070A` |
| Background soft | `#0B0D12` |
| Panel | `#101116` |
| Panel raised | `#171920` |
| Text | `#F7F4E8` |
| Muted text | `#A8ADBA` |
| Faint text | `#6F7482` |
| Primary accent | `#F6C90E` |
| Accent hover | `#FFD84D` |
| On accent | `#171204` |
| Info | `#3A82FF` |
| Success | `#33D17A` |
| Danger | `#FF5F6D` |
| Border | `rgba(255,255,255,0.08)` |
| Strong border | `rgba(255,255,255,0.16)` |

Cards, panels, inputs, buttons, tables, tags, and repeated content use an 8px radius. The app drawer/sidebar may use a larger shell radius.

## Components

- Sidebar: floating dark drawer on desktop, compact icon rail on tablet, off-canvas drawer on mobile.
- Brand mark: abstract yellow bars built in HTML/CSS, not a copied logo.
- Navigation: yellow icons, muted labels, yellow inset active indicator.
- Primary actions: yellow fill with dark text.
- Secondary actions: dark surface with subtle border.
- Data surfaces: compact panels, restrained shadows, no decorative orbs.
- Forms: dark inputs, yellow focus ring, stable hover states.
- Tables: horizontal scroll when needed, visible row hover, paid rows keep green status.
- Feedback: toasts, empty states, danger, success, and active states must stay visible on dark surfaces.

## Responsive Rules

- `1440px`: full floating sidebar plus dense dashboard grid.
- `1024px`: compact rail with icons only.
- `768px`: rail/grid should not create horizontal scroll.
- `375px`: off-canvas drawer with backdrop, Escape close, click-outside close, and visible menu button.

## Accessibility

- Normal text contrast target: at least 4.5:1.
- Non-text UI contrast target: at least 3:1.
- Focus rings use the yellow accent and must remain visible.
- All interactive controls need pointer cursor, hover state, active state, and keyboard focus state.
- Respect `prefers-reduced-motion`.

## Avoid

- Purple/blue gradients as the dominant theme.
- Marketing-style hero sections.
- Cards nested inside cards.
- Decorative bokeh/orb backgrounds.
- Emoji icons.
- Runtime dependency additions for visual styling.
