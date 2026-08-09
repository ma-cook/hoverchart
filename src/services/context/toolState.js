// Shared tool availability state. The `edit` tool's availability was previously
// gated on the number of scene objects, which is unrelated to whether the model
// has actually read any files. Track real file reads instead so edit is offered
// in a repo-connected space even with zero 3D objects.
let filesRead = 0;

export function recordFileRead() {
  filesRead += 1;
}

export function resetFileReadCount() {
  filesRead = 0;
}

export function filesReadCount() {
  return filesRead;
}
