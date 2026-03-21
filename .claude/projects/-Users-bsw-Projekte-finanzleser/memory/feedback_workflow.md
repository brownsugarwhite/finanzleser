---
name: Workflow rules — never change what works
description: Critical feedback about not changing existing working code/layout when adding new features
type: feedback
---

NEVER change components or layouts that the user confirmed are working.
- When adding a new feature, do NOT modify existing files unless absolutely necessary
- If positioning/layout was confirmed as correct ("it fits"), lock it in — don't touch it
- Commit working states before starting risky changes
- When something breaks, revert to the last known good state immediately, don't iterate on broken code

**Why:** Multiple times during the BookmarkNav and LogoAnimation sessions, working code was broken by unnecessary changes to TopNavigation, layout.tsx, or animation timing. The user lost working states because intermediate progress wasn't committed.

**How to apply:** Before adding a new component, check if it can be done WITHOUT touching existing files. If existing files must change, commit the current state first. Never move components between files (e.g., from layout to TopNavigation) without being asked.
