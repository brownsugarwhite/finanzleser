---
name: Animation feedback and preferences
description: User preferences for GSAP animations — organic, calm, not mechanical
type: feedback
---

Prefer calm, organic animations over snappy/mechanical ones.
- elastic.out feels too "snappy" for most cases — use back.out or power3.out instead
- Random variation in timing/size is good but keep it subtle (small ranges)
- Waterdrop: stretch slim, release bubbly (taller than default), settle with gentle bounce
- Don't make shapes too elliptic — keep border-radius always symmetric
- The height bounce after release should happen during the horizontal snap, not after
- overwrite:"auto" without killTweensOf created a mess — stick with killTweensOf + fresh timeline
- Distance-based timing is good: short hops fast, long ones slower

**Why:** The user iterates visually and has a strong eye for motion design. Mechanical or over-engineered animations feel wrong to them.

**How to apply:** When building GSAP animations, start with power3.out/back.out eases, subtle randomness, and symmetric border-radius. Let the user dial in the feel through iteration.
