---
name: Navigation system architecture
description: Full nav system with shared useNavPill hook, MegaMenu, FixedNav, BookmarkNav, LogoAnimation
type: project
---

Navigation system completed (2026-03-21). Architecture:

**Components:**
- `TopNavigation` — scrollable nav with glass pill hover, pink active, page blur
- `FixedNav` — fixed nav that appears on burger click (desktop), same pill behavior
- `BookmarkNav` — fixed bookmark tab with burger, search, Finanztools button
- `LogoAnimation` — lottie logo (full → fl) triggered by scroll
- `MegaMenu` — shared mega menu in layout, controlled via events
- `ProgressiveBlur` — fixed blur gradient at top (150px)
- `OverlayScrollbar` — custom scrollbar overlay

**Shared hook:**
- `useNavPill` — all pill behavior (waterdrop, hover zones, glass/pink states, lens sync, bloom, snap-back)

**Event system:**
- `mega-show` / `mega-hide` / `mega-closed` — mega menu control
- `burger-opened` / `burger-closed` — burger state
- `nav-scrolled-out` / `nav-scrolled-in` — scroll trigger for logo + burger
- `search-opened` / `search-closed` — search state

**Breakpoints:**
- ≤1024px: hide TopNavigation, burger always visible, logo uses scroll trigger
- ≤570px: hide Finanztools button, top: 15px, logo blurs on search open

**Brand colors:** Primary #45A117, Secondary #D3005E, Text #334a27

**Why:** This is the global navigation that will be on all pages, connected to WordPress ACF fields later.

**How to apply:** All nav components are in layout.tsx except TopNavigation (in page wrappers with 3-column layout). The mega menu content is placeholder — will be redesigned.
