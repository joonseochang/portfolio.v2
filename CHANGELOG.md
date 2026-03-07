# Changelog — Novel UX Patterns & Fixes

## 2026-03-05

### Hover Intent Delay (Clock Pill & Video Frame)
**Problem**: Mouse cursor passing through the clock pill or video frame hitbox triggered hover animations instantly, making the UI feel jittery during casual mouse movement.

**Solution**: Added a dwell-time threshold before activating hover state. `mouseEnter` sets a `setTimeout` (120ms for clock, 150ms for video frame); `mouseLeave` clears it and immediately deactivates. Quick pass-throughs never trigger the animation — only intentional hovers do.

**Pattern**:
```jsx
const hoverTimerRef = useRef(null);

onMouseEnter={() => {
  hoverTimerRef.current = setTimeout(() => setIsHovered(true), 120);
}}
onMouseLeave={() => {
  clearTimeout(hoverTimerRef.current);
  setIsHovered(false);
}}
```

**Files**: `src/App.jsx` (clock pill ~line 2670, video frame ~line 2780)

---

### Keyboard-Only Focus Rings (Global)
**Problem**: Interactive elements showed browser focus outlines on mouse click, which felt visually noisy. Removing outlines entirely would hurt keyboard accessibility (WCAG 2.4.7).

**Solution**: Two-rule CSS pattern — hide outline on mouse focus (`*:focus:not(:focus-visible)`), show custom ring on keyboard focus (`*:focus-visible`). Text inputs excluded since the cursor itself indicates focus.

```css
*:focus:not(:focus-visible) { outline: none; }
*:focus-visible:not(input):not(textarea):not(select) {
  outline: 2px solid rgba(36, 128, 237, 0.45);
  outline-offset: 2px;
  border-radius: 4px;
}
input:focus, textarea:focus, select:focus { outline: none; }
```

**Files**: `src/index.css` (top of file)

---

### Anti-Flicker Two-Layer Hover
**Problem**: Elements with extended hitboxes (`::before`) that transform on their own `:hover` flicker at edges — the transform moves the element away from the cursor momentarily.

**Solution**: Static outer parent is the hover target; inner child receives the transform via `.parent:hover .child`. Parent never moves, so hover is never lost.

```css
.parent:hover .child { transform: translateY(-1px); }
```

**Used in**: Music pill, contact rows, nav buttons, carousel arrows.

**Files**: `src/index.css`, `src/App.jsx`

---

### Keyboard Nav Scroll Suppression (Command Palette)
**Problem**: During keyboard navigation in the shortcuts palette, `scrollIntoView` moved rows under a stationary mouse, firing `onMouseEnter` and overriding the keyboard-selected index.

**Solution**: `suppressMouseRef` is set `true` on arrow key press; `onMouseEnter` checks it and skips. A `mousemove` listener clears the suppression, so mouse control resumes naturally when the user actually moves their mouse.

**Files**: `src/components/SlideUpModal.jsx`

---

### Typewriter Placeholder Animation
**Pattern**: Recursive `setTimeout` cycles through an array of phrases, typing character-by-character (55-85ms random speed), pausing (2s), then deleting (28ms per char), pausing (450ms), and moving to the next phrase. No fallback state — always mid-animation.

**Files**: `src/components/SlideUpModal.jsx` (PHRASES array + useEffect)
