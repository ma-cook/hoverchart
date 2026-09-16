/**
 * objectCodeService.js
 *
 * Resolves the source code that belongs to a given 3D object.
 *
 * Precedence:
 *   1. Inline-attached code (associateCodeWithObject / manual attach) on the
 *      object's metadata.
 *   2. Raw repo contents in the code store, indexed by codeFilePath.
 *   3. Chunked repo entries in the content store (`repo:<path>`), re-joined
 *      via joinChunks.
 *
 * When merfolkData carries a per-symbol startLine/endLine range, the resolved
 * text is sliced to exactly that symbol's code; otherwise the whole file is
 * returned so the viewer never shows an empty panel.
 */
import useCodeStore from '../stores/codeStore';
import { getContentStore } from './context/contentStore';
import { joinChunks } from './context/chunkIndex';

const CONTENT_ID_PREFIX = 'repo:';

/** Slice `{line, col}`-agnostic text by 1-based inclusive line range. */
const sliceRange = (text, startLine, endLine) => {
  const start = startLine != null ? Number(startLine) : NaN;
  const end = endLine != null ? Number(endLine) : NaN;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start) {
    return text;
  }
  const lines = text.split('\n');
  return lines.slice(start - 1, end).join('\n');
};

/** @param {import('../stores/objectsStore').ObjectData} objectData */
export function getCodeForObject(objectData) {
  if (!objectData) return null;

  const attached = objectData.metadata?.code;
  if (typeof attached === 'string' && attached.length > 0) {
    return attached;
  }

  const filePath = objectData.merfolkData?.codeFilePath || objectData.metadata?.codeFilePath || '';
  if (!filePath) return null;

  const range = {
    startLine: objectData.merfolkData?.startLine,
    endLine: objectData.merfolkData?.endLine,
  };

  const raw = useCodeStore.getState().repoFileContents?.[filePath];
  if (typeof raw === 'string' && raw.length > 0) {
    return sliceRange(raw, range.startLine, range.endLine);
  }

  const contentStore = getContentStore();
  const entry = contentStore.getEntry(`${CONTENT_ID_PREFIX}${filePath}`);
  if (entry?.chunks?.length > 0) {
    return sliceRange(joinChunks(entry.chunks), range.startLine, range.endLine);
  }

  return null;
}

/**
 * Reactive boolean: does this object have any code available to view?
 * Subscribes to the code store's repoFileContents so objects light up as soon
 * as a scan lands (or as soon as persistence hydration finishes).
 */
export function objectHasCode(objectData, codeStoreState) {
  if (!objectData) return false;
  if (typeof objectData.metadata?.code === 'string' && objectData.metadata.code.length > 0) {
    return true;
  }
  const filePath = objectData.merfolkData?.codeFilePath || objectData.metadata?.codeFilePath || '';
  if (!filePath) return false;
  const contents = codeStoreState?.repoFileContents;
  if (contents && typeof contents[filePath] === 'string' && contents[filePath].length > 0) {
    return true;
  }
  const contentStore = getContentStore();
  return !!contentStore.getEntry(`${CONTENT_ID_PREFIX}${filePath}`);
}