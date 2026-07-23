# AGENTS.md — Gaspra Browser

## Project

Gaspra is a Chromium-based desktop web browser built with Electron. Goal: do
everything Chrome does (tabs, history, bookmarks, downloads, extensions-grade
web rendering) plus a built-in **ad blocker** and **shield system** modeled on
Brave — implemented with `adblock-rs` (the Rust engine Brave uses), planned to
be bridged into the main process via native bindings / WASM and applied through
Electron's `session.webRequest` / `onBeforeRequest` filtering.

## Stack

- **Runtime:** Electron 39 (Chromium), `electron-vite` build.
- **UI:** React 19 + TypeScript, TailwindCSS 3 (HSL CSS-variable tokens), Radix UI primitives, shadcn-style components (`components/ui/`), `lucide-react` icons.
- **Persistence:** `better-sqlite3` (main process, `src/main/db/`).
- **Process model:** main (`src/main`) ↔ preload IPC bridge (`src/preload/api`) ↔ renderer (`src/renderer`). Web pages render in `<webview>` tags (`components/WebView`).

## Layout

```
src/main/       Electron main — window, IPC handlers, sqlite db, downloads, context menu, keyboard shortcuts
src/preload/    contextBridge API surface (one file per domain) + index.d.ts types
src/renderer/   React app — components/, context/ (React Context state), hooks/, lib/, assets/
```

Feature domains are mirrored across layers (e.g. `bookmarks`, `history`,
`downloads`, `tabs`, `quickLinks`, `searchHistory`, `settings`): a `db/`
module, a `handlers/` IPC handler, a `preload/api/` bridge, and a renderer
`context/`. Add a new feature by following that same 4-file pattern.

## Commands

```
npm run dev         # electron-vite dev
npm run build       # typecheck + build
npm run typecheck   # node + web tsconfigs
npm run lint        # eslint
npm run format      # prettier
npm run build:win   # package (win / mac / linux variants)
```

## Conventions

- Theme via classes on root: `.dark` / `.light` for mode, `.theme-accent-*` for accent. Style with semantic Tailwind tokens (`bg-background`, `text-foreground`, `border-border`), never hardcoded colors.
- Colors are HSL triplets in CSS variables — reference as `hsl(var(--token))`.
- Keep IPC types in sync in `src/preload/index.d.ts`.

## Design tokens (`src/renderer/src/assets/base.css`)

`--radius: 0.5rem`. All colors are `H S% L%` triplets consumed via
`hsl(var(--x))`.

### Semantic tokens (mode-dependent)

| Token | Dark | Light |
|---|---|---|
| `--background` | `240 10% 3.9%` | `0 0% 100%` |
| `--foreground` | `0 0% 98%` | `222.2 84% 4.9%` |
| `--card` / `--card-foreground` | `240 10% 3.9%` / `0 0% 98%` | `0 0% 100%` / `222.2 84% 4.9%` |
| `--popover` / `--popover-foreground` | `240 10% 3.9%` / `0 0% 98%` | `0 0% 100%` / `222.2 84% 4.9%` |
| `--secondary` / `-foreground` | `240 3.7% 15.9%` / `0 0% 98%` | `210 40% 96.1%` / `222.2 47.4% 11.2%` |
| `--muted` / `-foreground` | `240 3.7% 15.9%` / `240 5% 64.9%` | `210 40% 96.1%` / `215.4 16.3% 46.9%` |
| `--accent` / `-foreground` | `240 3.7% 15.9%` / `0 0% 98%` | `210 40% 96.1%` / `222.2 47.4% 11.2%` |
| `--destructive` / `-foreground` | `0 62.8% 30.6%` / `210 40% 98%` | `0 84.2% 60.2%` / `210 40% 98%` |
| `--border` / `--input` | `240 3.7% 15.9%` | `214.3 31.8% 91.4%` |

### Accent tokens (`--primary`, `--primary-foreground`, `--ring`)

Set by `.theme-accent-*`. Dark/light `--primary`:

| Accent | Dark | Light |
|---|---|---|
| blue (default) | `217.2 91.2% 59.8%` | `221.2 83.2% 53.3%` |
| purple | `262.1 83.3% 57.8%` | `262.1 83.3% 57.8%` |
| pink | `330 81% 60%` | `330 81% 60%` |
| green | `142.1 70.6% 45.3%` | `142.1 76.2% 36.3%` |
| orange | `25 95% 53%` | `24.6 95% 53.1%` |
| red | `0 72% 51%` | `0 84.2% 60.2%` |
| cyan | `189 94% 43%` | `189 94% 43%` |
| yellow | `48 96% 53%` | `47.9 95.8% 53.1%` |

`--ring` tracks `--primary` (blue-dark ring is `224.3 76.3% 48%`).

### Other

- Font: `Inter`, system-ui fallback stack.
- Scrollbars themed with `--muted` track and `--primary` thumb (webkit + Firefox).
