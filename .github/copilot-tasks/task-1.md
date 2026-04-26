# Task: 1. Screen-share double prompt

Likely cause: the screen-share effect in ScreenShareStream.jsx:75 re-runs because useScreenShareStore.getScreenShare() returns a fresh default object before any entry exists, flipping retryTrigger from 0→undefined→0 mid-acquisition. This fires getDisplayMedia a second time; cancelling the second picker rejects the original promise as NotAllowedError.

Steps:

Make getScreenShare in screenShareStore.js:9 return a stable entry (initialize on first read).
Add an acquisitionInFlightRef guard in ScreenShareStream to block a second getDisplayMedia for the same streamId.
Trim effect deps: drop meshRef and screenShareConstraints; use a single primitive shouldStart value.
On user-cancelled picker, set a local cancelled flag so we don't show "permission denied" UI.