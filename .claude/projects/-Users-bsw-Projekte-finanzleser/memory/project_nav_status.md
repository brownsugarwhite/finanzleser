---
name: TopNavigation current state
description: Glass pill nav with waterdrop animation, pink active state, mega menu — completed Phase 2 step 3
type: project
---

TopNavigation component is feature-complete for now (2026-03-18).

**What's built:**
- Glass pill hover with magnified text clone (7% scale, green text/sparks)
- Waterdrop animation: stretch slim → release bubbly with back.out bounce
- Pink active state on click (#D3005E, white text/sparks)
- Dummy mega menu with animated title swap
- Page content scales 0.9 + blurs 13px on menu open (viewport-centered transform-origin)
- Pill shadow from Figma (outer + inset shadow, 17px radius, 44px default height)
- Seamless hover zones splitting at spark midpoints
- Close via click outside buttons/mega or ✕ button
- Subtle grow (+8px) when hovering the active button while it's sitting pink

**Brand colors confirmed by user:**
- Primary green: #45A117
- Secondary pink: #D3005E
- Text: #334a27

**Why:** This is Phase 2 step 3 (Navigation/Menü) of the relaunch. Next steps likely: Hero Section, then further design implementation.

**How to apply:** The nav component is at components/ui/TopNavigation.tsx. The mega menu content is placeholder — real content comes later. The liquidGL scripts in public/scripts/ are no longer used by the nav (we switched to CSS clone approach) but are still committed.
