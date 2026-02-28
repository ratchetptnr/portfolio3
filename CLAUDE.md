# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Turbopack)
npm run build      # Production build — always run before committing
npm run lint       # ESLint check
npm run start      # Run production build locally
```

> **Important:** The global npm config has `omit=dev` set, which silently skips devDependencies.
> If `@tailwindcss/postcss` is missing and the build fails, run:
> ```bash
> npm install --include=dev
> ```
> This happens after fresh installs or when Vercel restores a cache. Always make sure `package.json` and `package-lock.json` are committed when adding new dependencies.

## Architecture

### Boot Flow (page.tsx state machine)

The app simulates a computer boot sequence using a 3-stage state machine:

```
"sleep"  →  "login"  →  "desktop"
```

All three layers are mounted simultaneously and stacked via z-index:
- `<Desktop />` — always mounted at the bottom (z-index normal). Pre-rendered so the transition feels instant.
- `<LoginScreen />` — z-[150], visible during `sleep` and `login` stages. During `sleep`, the BIOS screen covers it.
- `<SleepScreen />` — z-[200], only mounted during `sleep` stage. Unmounts after its fade-out animation completes.

The `<MenuBar />` lives in `layout.tsx` and is always rendered — it sits beneath both overlays.

### Theming

- Tailwind CSS **v4** — no `tailwind.config.ts`. All theme tokens are defined inline in `src/app/globals.css` under `@theme`.
- Dark mode uses `@custom-variant dark (&:is(.dark *))` — the `.dark` class is set on `<html>` by `next-themes`.
- All colors use the **OKLCH color space**. Use `color-mix(in oklch, ...)` for opacity/mixing.
- shadcn style: **New York**, base color: **Neutral**, CSS variables enabled.

### Desktop Component (`src/components/desktop/`)

`index.tsx` manages the full desktop surface:
- **Grid system**: Icons snap to a `CELL_W=100 × CELL_H=108` invisible grid with `GRID_PAD=24` padding. BFS finds the nearest free slot on drop.
- **Drag**: Uses raw Pointer Events on `window` (not React drag APIs) to avoid re-render overhead. Position is tracked in state; velocity is tracked in refs.
- **Rotation physics**: Framer Motion `motionValue` + `useSpring` stored in `useRef` (not component state) so rotation updates are frame-level and never trigger React re-renders.
- **Double-click detection**: Tracked manually via `lastTapRef` (timestamp + id) since `e.preventDefault()` on `pointerdown` suppresses the native `dblclick` event.
- **Window management**: `openWindows` array + `zMap` record manage open windows and focus order. `zCounter` ref is incremented to bring windows to front.

`window.tsx` is the resizable macOS-style window:
- Outer `motion.div` has **no** `overflow-hidden` so resize handles (8px edge strips + 16px corners) can bleed outside the chrome.
- Inner `div` has `overflow-hidden rounded-xl` for the visual chrome.
- Title-bar drag and edge/corner resize both use separate `useRef` objects (`drag` and `resize`) checked in a shared `pointermove` listener.

### Fonts

Three fonts are loaded in `layout.tsx` and exposed as CSS variables:
| Variable | Font | Usage |
|---|---|---|
| `--font-geist-sans` | Geist Sans | Body / UI |
| `--font-geist-mono` | Geist Mono | Code / monospace |
| `--font-geist-pixel-square` | Geist Pixel Square | BIOS sleep screen only |

Geist Pixel is imported from the `geist` npm package (`geist/font/pixel`), not Google Fonts.

### Menu Bar (`src/components/menu-bar/`)

- Dropdown open/close is **controlled** via `activeMenu` state (not Radix's uncontrolled mode) to enable hover-to-switch between menus.
- The clock popover (shadcn `Popover`) contains a live SVG analog clock + shadcn `Calendar`. A single `setInterval` feeds both.
- Menu bar dropdowns are styled via `.menubar-dropdown` in `globals.css` using CSS variables — not Tailwind classes — because Radix portals the content outside the component tree.

### Key Patterns

- **Stale closure avoidance**: Any state read inside a `useEffect`-mounted event listener must use a `useRef` mirror (e.g. `iconsRef`, `openWindowsRef`). State setters are stable and safe to call directly.
- **shadcn components**: Add with `npx shadcn@latest add <component>`. The `components.json` is already configured.
- **Icons**: Use `lucide-react` for UI/system icons, `@phosphor-icons/react` for desktop file icons (weight="thin" is the house style).
