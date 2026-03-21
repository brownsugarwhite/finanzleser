---
name: Efficiency rules — commit often, simplest first, one change at a time
description: Critical workflow feedback from failed LogoAnimation session — how to avoid wasting time
type: feedback
---

1. **Commit before every experiment.** If something works, commit immediately. Always have a known good state to revert to.

2. **Build the simplest version first.** Let the user see it before adding complexity. Don't jump to proxy objects, timelines, or frame-by-frame control when `anim.play()` + a simple tween might work.

3. **When told "don't touch X" — don't touch it.** Write the constraint down in tasks so it's visible throughout the session.

4. **One change at a time.** Don't bundle positioning + animation + layout + easing in one edit. If any one breaks, isolate which.

5. **Ask before guessing.** Especially for positioning/layout where the user has a clear visual in mind. 3 failed guesses waste more time than 1 question.

6. **Stop after 3 failed attempts.** Pause and ask the user to describe it differently or simplify the approach together. Don't iterate 10 times on the same broken approach.

**Why:** The LogoAnimation session (2026-03-20) wasted hours because of stacked changes, overcomplicated lottie sync, and repeatedly modifying files the user said not to touch. The task was fundamentally simple (fixed div + play lottie + move position).

**How to apply:** Before writing code, state the plan in 1-2 sentences. Get confirmation. Make the smallest possible change. Commit if it works. Repeat.
