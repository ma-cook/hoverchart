# Task: 3. Enlarge task status bar

Steps

At TextObject.jsx:2248-2259: badge fontSize 10px→16px, padding 1px 6px→4px 12px, borderRadius 8px→10px.
At TextObject.jsx:2235-2241: container padding 4px 8px→6px 10px, fontSize 11px→13px.
Verify legibility at default collapsed scale [4, 3, 1].

---

## Verification

Send plan tasks → click task expands → click empty space collapses → click different task swaps selection (Phase 1).
Move camera between cells — top-right updates, UUID remains in sidebar (Phase 2).
Status label readable at normal distance (Phase 3).