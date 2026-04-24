# Task: 1. Move cell info to top-right

Steps

Delete the "Current cell: x,y,z" span from the sidebar at UIOverlay.jsx:1363-1375. Keep UUID block.
Add a small pill element inside the fixed top-right container at SpacePresenceAvatars.jsx:81-90 showing the same currentCell coordinates.
Verify coords update as camera moves and UUID stays in sidebar.