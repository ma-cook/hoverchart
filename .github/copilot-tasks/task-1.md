# Task: 1. Task collapse-on-deselect

The collapse code already exists at TextObject.jsx:735-738: when selected becomes false, toggleTaskExpansion(id) runs. The bug is upstream — the selected prop isn't being set back to false when clicking elsewhere.

Steps

Trace where selected comes from (selection store) and identify why empty-space clicks / other-object clicks don't clear it for text objects specifically.
Apply the fix at the layer that already deselects other object types (likely a canvas onPointerMissed or the selection store's setter).
Verify all three collapse triggers: empty click, different-object click, context-menu button.