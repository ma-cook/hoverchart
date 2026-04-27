#!/usr/bin/env bash
# Downloads MediaPipe model assets into public/assets/mediapipe/.
# Run once after cloning, or whenever a new model version is needed.
# These binaries are intentionally excluded from git (see .gitignore).
set -euo pipefail

DEST="$(dirname "$0")/../public/assets/mediapipe"
mkdir -p "$DEST"

echo "Downloading hand_landmarker.task …"
curl -fL -o "$DEST/hand_landmarker.task" \
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"

echo "Done. Model saved to $DEST/hand_landmarker.task"
