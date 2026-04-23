Phase 1 — Task collapse-on-deselect
The collapse code already exists at TextObject.jsx:735-738: when selected becomes false, toggleTaskExpansion(id) runs. The bug is upstream — the selected prop isn't being set back to false when clicking elsewhere.

Steps

Trace where selected comes from (selection store) and identify why empty-space clicks / other-object clicks don't clear it for text objects specifically.
Apply the fix at the layer that already deselects other object types (likely a canvas onPointerMissed or the selection store's setter).
Verify all three collapse triggers: empty click, different-object click, context-menu button.
Phase 2 — Move cell info to top-right
Steps

Delete the "Current cell: x,y,z" span from the sidebar at UIOverlay.jsx:1363-1375. Keep UUID block.
Add a small pill element inside the fixed top-right container at SpacePresenceAvatars.jsx:81-90 showing the same currentCell coordinates.
Verify coords update as camera moves and UUID stays in sidebar.
Phase 3 — Enlarge task status bar
Steps

At TextObject.jsx:2248-2259: badge fontSize 10px→16px, padding 1px 6px→4px 12px, borderRadius 8px→10px.
At TextObject.jsx:2235-2241: container padding 4px 8px→6px 10px, fontSize 11px→13px.
Verify legibility at default collapsed scale [4, 3, 1].
Verification
Send plan tasks → click task expands → click empty space collapses → click different task swaps selection (Phase 1).
Move camera between cells — top-right updates, UUID remains in sidebar (Phase 2).
Status label readable at normal distance (Phase 3).
Further Considerations
Phase 1 fix location — canvas onPointerMissed vs selection store setter vs parent component. Recommendation: match whichever layer already handles deselection for cubes/dodecahedrons.
Phase 2 narrow viewports — top-right strip could overflow with many users + cell pill. Recommendation: ship as-is; revisit if reported.