# Portfolio Project Context

## Tech Stack & Key Files
- **Stack**: React 18 + Vite, Tailwind CSS, Framer Motion (lazy), Netlify Functions (TS), Netlify Blobs
- **Deploy**: Netlify (`npm run build`), functions auto-detected from `netlify/functions/`
- **Main files**: `src/App.jsx`, `src/index.css`, `src/components/SlideUpModal.jsx`
- **CMS**: Edit `cms-data/*.json` (source), NOT `public/cms-data/` (build output, auto-copied by Vite)

## Environment Variables
| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_LASTFM_API_KEY`, `VITE_LASTFM_USERNAME` | `.env` | Last.fm client-side |
| `GITHUB_TOKEN`, `GITHUB_USERNAME` | Netlify dashboard | GitHub stats server-side |

## GitHub Stats
- **Function**: `netlify/functions/get-github-stats.mts` → **Hook**: `src/hooks/useGitHubStats.js`
- Rolling 7-day window, edge cached 1hr

---

## Video Compression

### Settings
| Setting | Value |
|---------|-------|
| Suffix | `_Premium` |
| CRF | 26 |
| Audio | None (use `-an` flag) |
| Size | 2-4MB |

### Command
```bash
ffmpeg -i "input.mov" -vf "scale=-2:1080" -c:v libx264 -crf 26 -preset medium -an -movflags +faststart "output_Premium.mp4" -y
```

### Bunny CDN Upload
```bash
curl -X PUT "https://sg.storage.bunnycdn.com/joonseo/premium/Name_Premium.mp4" \
  -H "AccessKey: 1e3cbf6e-2794-4ad8-8c1e20e72aaa-8f1b-4acf" \
  -H "Content-Type: video/mp4" \
  --data-binary @"public/videos/compressed/premium/Name_Premium.mp4"
```
CDN URL: `https://joonseo-videos.b-cdn.net/premium/Name_Premium.mp4`

### Bunny Cache Purge
```bash
curl -X POST "https://api.bunny.net/purge?url=https://joonseo-videos.b-cdn.net/premium/Name_Premium.mp4" \
  -H "AccessKey: b461e284-681a-465a-a587-8526584b80a62ad794b7-1140-4eec-87e5-93f51adea239"
```
Account API Key (for cache purge): `b461e284-681a-465a-a587-8526584b80a62ad794b7-1140-4eec-87e5-93f51adea239`

### Update JSON
Edit `cms-data/homepage-media.json` with `src` CDN URL.

---

## Design System

### Philosophy
**Skeuomorphic-minimal**: Physical surfaces (gradients, inset shadows, subtle borders) + restrained typography. No bold, no icons libraries, no emoji.

### Typography
| Size | Usage |
|------|-------|
| 11px | Micro labels (uppercase, tracking-wide) |
| 14px | **Default** - body, buttons, nav |
| 15px | Modal headings |
| 22px | Large stats |

- **Fonts**: Graphik (400 regular, 500 medium), Calluna (H1 only)
- **Line height**: `leading-[25px]` for body paragraphs
- **Never use bold (700)**

### Colors

**Light text**: `#1a1a1a` (primary) → `#5B5B5E` (secondary) → `#888` (tertiary) → `#999` (muted)
**Dark text**: `#e6eaee` (primary) → `#969494` (muted)
**Accents**: `#2480ED` (blue/links), `#22c55e` (green/live), `#ef4444` (red/alerts)

**Backgrounds** (always vertical gradients):
- Light: `#ffffff → #fcfcfc` (default), `#fefefe → #fafafa` (hover)
- Dark: `#1e1e1f → #161617` (sections), `#2a2a2b → #1f1f20` (buttons)

### Borders
- Light: `1px solid rgba(235, 238, 245, 0.85)`
- Dark: `1px solid rgba(255, 255, 255, 0.08)`

### Shadows (4-layer system)
```css
/* Light button */
box-shadow: 0 0.5px 1px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02),
  inset 0 0.5px 0 rgba(255,255,255,0.6), inset 0 -0.5px 0 rgba(0,0,0,0.015);
```

### Spacing & Radius
- **Spacing rhythm**: 4-6-8-10-12px
- **Radius**: 8px (default), 14px (pills), 20px (outermost)

### Layout
- **Breakpoint**: 813px (single breakpoint only)
- **Desktop**: 771px total (375px left + 50px gap + 346px right)
- **Mobile**: Full width, 24px padding, stacked

### Interactions
- **Hover**: `translateY(-0.5px)`, shadow increase, 150-200ms
- **Active**: `translateY(0)`, `scale(0.995)`, 50-80ms
- **Three states required**: default, hover, active

### Anti-Flicker Hover Pattern (Two-Layer Approach)

When an interactive element has an extended hitbox (via `::before`) AND transforms on hover, use this pattern to prevent flicker at edges:

**Problem**: If the element transforms on its own `:hover`, moving the element can cause the mouse to momentarily leave the element, triggering flicker.

**Solution**: Two-layer structure where outer stays static, inner transforms.

```jsx
{/* Outer element: stays static, has ::before hitbox, is the hover target */}
<button className="contact-row">
  {/* Inner element: transforms on hover */}
  <div className="contact-row-inner">
    {/* Visual content here */}
  </div>
</button>
```

```css
/* Outer: static, transparent, extended hitbox */
.contact-row {
  background: transparent;
  position: relative;
}
.contact-row::before {
  content: '';
  position: absolute;
  top: -8px; left: -10px; right: -10px; bottom: -8px;
  pointer-events: auto;
}

/* Inner: transforms on parent hover */
.contact-row-inner {
  transition: transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.contact-row:hover .contact-row-inner {
  transform: translateY(-1px);
}
```

**Key**: `.parent:hover .child` — hover is detected on static parent, transform applied to child. Parent never moves, so hover state is never lost.

**Used in**: Music pill (`music-player-button` + `music-button-inner`), contact rows (`contact-row` + `contact-row-inner`), can be applied to any similar component.

### Animation Durations
| Speed | Duration | Usage |
|-------|----------|-------|
| Instant | 50-80ms | Press feedback |
| Quick | 150-200ms | Hover |
| Standard | 250-350ms | Modals |
| Comfortable | 400-500ms | Page transitions |

### Easing
- Standard: `cubic-bezier(0.4, 0, 0.2, 1)`
- Spring: `cubic-bezier(0.34, 1.2, 0.64, 1)`
- Smooth: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Icons
Custom inline SVG only. `strokeWidth="1.5"`, `strokeLinecap="round"`, color `#a3a3a3`.

### Links
Dotted underlines only: `text-decoration: underline dotted; text-decoration-thickness: 2px; text-underline-offset: 3px;`

### What NOT To Do
No bold text, no icon libraries, no solid underlines, no radial gradients, no CSS Grid for layout, no rounded-full buttons, no pure black (#000), no emoji, no Tailwind color classes (use exact hex).

---

## Animated Gridlines (Dark Sections)

```css
.gridline-vertical {
  width: 1px;
  background-image: repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0px 6px, transparent 6px 12px);
  animation: gridlineMarchV 8s linear infinite;
}
@keyframes gridlineMarchV { to { background-position-y: -12px; } }
```

Dark section bg: `linear-gradient(180deg, #1e1e1f 0%, #161617 100%)`

---

## API Philosophy

**Ambient over informational** - One stat, not many. Muted by default, detailed on hover. Cache aggressively. Degrade gracefully (show nothing on error).

### Current APIs
| Feature | Provider | Key? |
|---------|----------|------|
| Weather | Open-Meteo | No |
| Sun/Moon | SunCalc (npm) | No |
| Music | Last.fm | Yes (client) |
| GitHub | GitHub API | Yes (Netlify fn) |

Location derives from `clock_location` in `cms-data/website-copy.json` → never hardcode coordinates.

### Weather Codes
`0→Clear, 1→Mostly Clear, 2→Partly Cloudy, 3→Overcast, 45/48→Foggy, 51-55→Drizzle, 61-65→Rainy, 71-75→Snowy, 80-82→Showers, 95→Thunderstorm`

---

## Multi-Agent Conflict Prevention

Multiple Claude agents may work in parallel on different features. Follow this protocol strictly to avoid conflicts.

### Hot Files — Never edit these without coordination
| File | Why it's hot |
|------|-------------|
| `src/App.jsx` | All state, routing, modal logic — high merge conflict risk |
| `src/index.css` | Global CSS — class collisions silently break things |
| `src/components/SlideUpModal.jsx` | Shared modal shell used by every modal |

### Session Start Checklist (MANDATORY)
1. `git pull origin main` — sync to latest before doing anything
2. `git status` — verify clean working tree; if dirty, stash or commit first
3. Identify which hot files your task needs to touch
4. If another agent may be touching the same hot file, scope work to **new files only** until you can merge

### Branch Strategy
| Scope | Branch needed? |
|-------|---------------|
| Single new file (new hook, new component) | No — commit directly to `main` |
| 2+ hot file edits | Yes — use `feat/<short-name>` |
| Conflicting with known parallel work | Yes — always branch |

```bash
git checkout -b feat/my-feature
# ... work ...
git checkout main && git pull && git merge feat/my-feature
```

### Conflict-Safe Patterns
- **Prefer new files** over editing hot files. New hook → `src/hooks/useXxx.js`. New component → `src/components/Xxx.jsx`. Import into `App.jsx` in a single, small diff.
- **Isolate CSS** — add new component styles in a scoped class block at the bottom of `index.css`, never inline into existing blocks.
- **Never reformat** hot files. Only change lines you need to change. Reformatting creates false conflicts.
- **Atomic commits** — one logical change per commit. Easier to cherry-pick and revert.

### Pre-Deploy Gate
Before every commit to `main`:
```bash
npm run build   # must succeed with zero errors
git diff main   # review your changes one final time
```
If build fails, fix before committing — never commit a broken build.

---

## Responsive Audit

**Breakpoints**: Desktop ≥814px, Tablet 481-813px, Phone ≤480px

- Check hardcoded widths >300px (mobile overflow)
- Verify mobile media queries exist for new components
- Modals: centered overlay on mobile
- Bottom pill: icon-only on mobile
