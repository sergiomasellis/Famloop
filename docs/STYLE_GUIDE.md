# FamLoop Design Guide (Neo-Brutalism)

This document outlines the styling conventions for FamLoop, following a **Neo-Brutalist** aesthetic. This guide is intended for both human developers and AI agents to ensure consistency across the application.

## Core Philosophy

-   **Raw & Bold**: High contrast, thick borders, hard shadows.
-   **Functional yet Playful**: Use distinct, exaggerated UI elements that feel tactile.
-   **Accessible**: Despite the "brutal" name, maintain high readability and proper contrast ratios.
-   **Dark Mode Support**: All Neo-Brutalist tokens (borders, shadows) must adapt to dark mode using semantic variables.

## Design Tokens

### Borders

-   **Standard Width**: `border-2`
-   **Color**: `border-border` (Semantic variable).
    -   In Light Mode: `oklch(0 0 0)` (Black)
    -   In Dark Mode: `oklch(1 0 0)` (White)
-   **Usage**: Almost all containers (Cards, Dialogs, Inputs, Buttons) should have a `border-2 border-border`.

### Shadows

-   **Hard Shadows**: No blur. Distinct directional offset.
-   **Token**: `shadow-[4px_4px_0px_0px_var(--shadow-color)]` (Standard)
    -   For smaller elements (buttons, badges): `shadow-[2px_2px_0px_0px_var(--shadow-color)]`
    -   For hover states: Increase offset, e.g., `shadow-[6px_6px_0px_0px_var(--shadow-color)]`
-   **Color**: `var(--shadow-color)` (Always black `#000000`, even in dark mode, to maintain contrast against background).

### Radius

-   **Standard**: `rounded-md` or `rounded-xl`.
-   **Note**: While brutalism often uses sharp corners, our "Neo" variation allows for slight rounding to soften the harshness while keeping the bold definition.

### Colors

#### Core Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-background` | `oklch(0.98 0.01 80)` - Off-white/Cream | `oklch(0.1 0 0)` - Dark Gray | Main page background |
| `text-foreground` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Primary text color |
| `bg-card` | `oklch(1 0 0)` - White | `oklch(0.15 0 0)` - Darker Gray | Card backgrounds |
| `text-card-foreground` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Text on cards |
| `bg-popover` | `oklch(1 0 0)` - White | `oklch(0.15 0 0)` - Darker Gray | Popover/dropdown backgrounds |
| `text-popover-foreground` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Text in popovers |
| `bg-input` | `oklch(1 0 0)` - White | `oklch(0.15 0 0)` - Darker Gray | Input field backgrounds |
| `border-border` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | All borders (adapts to theme) |
| `ring` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Focus ring color |

#### Primary Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-primary` | `oklch(0.6 0.2 270)` - Vibrant Purple | `oklch(0.7 0.2 270)` - Brighter Purple | Primary actions, CTAs, headers |
| `text-primary-foreground` | `oklch(1 0 0)` - White | `oklch(0 0 0)` - Black | Text on primary backgrounds |

#### Secondary Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-secondary` | `oklch(0.85 0.15 60)` - Vibrant Orange/Yellow | `oklch(0.85 0.15 60)` - Same | Secondary actions, highlights |
| `text-secondary-foreground` | `oklch(0 0 0)` - Black | `oklch(0 0 0)` - Black | Text on secondary backgrounds |

#### Accent Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-accent` | `oklch(0.7 0.2 150)` - Vibrant Green | `oklch(0.7 0.2 150)` - Same | Accent elements, success states |
| `text-accent-foreground` | `oklch(0 0 0)` - Black | `oklch(0 0 0)` - Black | Text on accent backgrounds |

#### Destructive Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-destructive` | `oklch(0.6 0.2 20)` - Vibrant Red | `oklch(0.7 0.2 20)` - Brighter Red | Delete actions, errors, warnings |
| `text-destructive-foreground` | `oklch(1 0 0)` - White | `oklch(0 0 0)` - Black | Text on destructive backgrounds |

#### Muted Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-muted` | `oklch(0.95 0 0)` - Light Gray | `oklch(0.2 0 0)` - Dark Gray | Subtle backgrounds, disabled states |
| `text-muted-foreground` | `oklch(0.4 0 0)` - Medium Gray | `oklch(0.7 0 0)` - Light Gray | Secondary text, placeholders |

#### Event Colors (High Saturation)

These colors are used for calendar events and chore categorization:

| Token | Value | Usage |
|-------|-------|-------|
| `--event-green` | `oklch(0.85 0.15 150)` - Vibrant Green | Green events/chores |
| `--event-purple` | `oklch(0.8 0.15 300)` - Vibrant Purple | Purple events/chores |
| `--event-orange` | `oklch(0.85 0.15 60)` - Vibrant Orange | Orange events/chores |
| `--event-blue` | `oklch(0.8 0.15 250)` - Vibrant Blue | Blue events/chores |

**Note**: Event colors are defined as CSS custom properties. Access them via `var(--event-green)`, etc.

#### Chart Colors

Used for data visualization and charts:

| Token | Value | Usage |
|-------|-------|-------|
| `--chart-1` | `oklch(0.6 0.2 270)` - Purple | Primary chart color |
| `--chart-2` | `oklch(0.85 0.15 60)` - Orange/Yellow | Secondary chart color |
| `--chart-3` | `oklch(0.7 0.2 150)` - Green | Tertiary chart color |
| `--chart-4` | `oklch(0.6 0.2 20)` - Red | Quaternary chart color |
| `--chart-5` | `oklch(0.8 0.15 250)` - Blue | Quinary chart color |

#### Sidebar Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-sidebar` | `oklch(0.98 0.01 80)` - Off-white/Cream | `oklch(0.1 0 0)` - Dark Gray | Sidebar background |
| `text-sidebar-foreground` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Sidebar text |
| `bg-sidebar-primary` | `oklch(0.6 0.2 270)` - Purple | `oklch(0.7 0.2 270)` - Brighter Purple | Sidebar primary elements |
| `text-sidebar-primary-foreground` | `oklch(1 0 0)` - White | `oklch(0 0 0)` - Black | Text on sidebar primary |
| `bg-sidebar-accent` | `oklch(0.85 0.15 60)` - Orange/Yellow | `oklch(0.85 0.15 60)` - Same | Sidebar accent elements |
| `text-sidebar-accent-foreground` | `oklch(0 0 0)` - Black | `oklch(0 0 0)` - Black | Text on sidebar accent |
| `border-sidebar-border` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Sidebar borders |
| `ring-sidebar-ring` | `oklch(0 0 0)` - Black | `oklch(1 0 0)` - White | Sidebar focus rings |

#### Shadow Color

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-color` | `#000000` - Black | Always black, even in dark mode, for contrast |

### Color Usage Guidelines

1. **Always use semantic tokens**: Never hardcode colors like `bg-white` or `text-black`. Use `bg-card` and `text-foreground` instead.

2. **Dark mode compatibility**: All colors automatically adapt to dark mode when using semantic tokens. The `border-border` token switches from black to white, ensuring visibility in both themes.

3. **High saturation**: Our palette uses high saturation values (0.15-0.2) for vibrant, bold colors that match the Neo-Brutalist aesthetic.

4. **OKLCH color space**: Colors are defined in OKLCH for better perceptual uniformity and easier manipulation. Format: `oklch(lightness chroma hue)`.

## Component Patterns

### 1. Buttons

**Style**:
```tsx
className="border-2 border-border shadow-[2px_2px_0px_0px_var(--shadow-color)] bg-primary text-primary-foreground font-bold uppercase hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
```

-   **Hover Effect**: The button should visually "lift" (translate up/left) and the shadow should grow.
-   **Active/Pressed Effect**: The button should "press" down (translate down/right) and the shadow should disappear or shrink.

### 2. Inputs & Selects

**Style**:
```tsx
className="h-12 border-2 border-border bg-input shadow-[4px_4px_0px_0px_var(--shadow-color)] focus-visible:ring-0 focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-none transition-all"
```

-   **Interaction**: On focus, the element should "press" down to flatten against the page (remove shadow, translate).

### 3. Cards

**Style**:
```tsx
className="rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--shadow-color)]"
```

-   **Hover (Interactive Cards)**:
    ```tsx
    hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all
    ```

### 4. Dialogs & Modals

-   **Overlay**: `bg-black/50` (Standard dimming).
-   **Content**:
    ```tsx
    border-2 border-border shadow-[8px_8px_0px_0px_var(--shadow-color)]
    ```
-   **Headers**: Solid colors (e.g., `bg-primary`) with `border-b-2 border-border`. Text should be `uppercase tracking-tight` and `font-black`.

## Typography

-   **Headings**: `font-black`, `uppercase`, `tracking-tight`.
-   **Body**: Standard sans-serif (`DM Sans` / `Inter`).
-   **Labels**: `font-bold`, often `uppercase`.

## Dark Mode Implementation

DO NOT use hardcoded colors like `border-black` or `bg-white` for structural elements. Always use semantic tokens:

-   ❌ `border-black` (Invisible in dark mode against dark background)
-   ✅ `border-border` (Auto-switches to white in dark mode)

-   ❌ `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` (Hardcoded black shadow)
-   ✅ `shadow-[4px_4px_0px_0px_var(--shadow-color)]` (System variable)

## Common Utilities (Tailwind)

The `globals.css` includes custom utility classes for convenience:

-   `.neo-card`: Applies standard border and shadow.
-   `.neo-button`: Applies standard button styles.

*Prefer using the full Tailwind classes in components for granularity, but these serve as the reference implementation.*

