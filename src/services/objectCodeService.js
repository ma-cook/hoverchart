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
import useDiagramStore from '../stores/diagramStore';
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

/**
 * Resolve the code location for an object with the full precedence chain:
 *   1. The object's own merfolkData/metadata (parsed/inline association).
 *   2. The live diagram graph, indexed by merfolkData.nodeId — so objects that
 *      were created before the parser emitted codeFilePath (or whose symbols
 *      the scanner left without a codeFilePath block) still resolve their code
 *      on reload / re-hydration, because the freshly parsed graph node carries
 *      the association.
 * Returns `{ filePath, startLine, endLine, nodeId }` — empty filePath means no
 * association exists anywhere.
 */
export function resolveCodeInfo(objectData, nodeCodeIndex) {
  let filePath = objectData?.merfolkData?.codeFilePath || objectData?.metadata?.codeFilePath || '';
  let startLine = objectData?.merfolkData?.startLine;
  let endLine = objectData?.merfolkData?.endLine;

  if (!filePath) {
    const nodeId = objectData?.merfolkData?.nodeId;
    if (nodeId) {
      const lookup = nodeCodeIndex ?? useDiagramStore.getState().nodeCodeIndex;
      const resolved = lookup?.get(nodeId);
      if (resolved?.codeFilePath) {
        filePath = resolved.codeFilePath;
        if (startLine == null) startLine = resolved.startLine;
        if (endLine == null) endLine = resolved.endLine;
      }
    }
  }

  return { filePath, startLine, endLine };
}

/** @param {import('../stores/objectsStore').ObjectData} objectData */
export function getCodeForObject(objectData) {
  if (!objectData) return null;

  const attached = objectData.metadata?.code;
  if (typeof attached === 'string' && attached.length > 0) {
    return attached;
  }

  const { filePath, startLine, endLine } = resolveCodeInfo(objectData);
  if (!filePath) return null;

  const range = {
    startLine: startLine ?? objectData.merfolkData?.startLine,
    endLine: endLine ?? objectData.merfolkData?.endLine,
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
 * as a scan lands (or as soon as persistence hydration finishes). Pass
 * `nodeCodeIndex` (from useDiagramStore) so objects whose own codeFilePath is
 * empty still resolve through their graph node's association.
 */
export function objectHasCode(objectData, codeStoreState) {
  if (!objectData) return false;
  if (typeof objectData.metadata?.code === 'string' && objectData.metadata.code.length > 0) {
    return true;
  }
  const filePath = resolveCodeInfo(objectData, codeStoreState?.nodeCodeIndex).filePath;
  if (!filePath) return false;
  const contents = codeStoreState?.repoFileContents;
  if (contents && typeof contents[filePath] === 'string' && contents[filePath].length > 0) {
    return true;
  }
  const contentStore = getContentStore();
  return !!contentStore.getEntry(`${CONTENT_ID_PREFIX}${filePath}`);
}