/**
 * useObjectsEditedByLlm.js
 *
 * Reactive hook that returns the set of scene-object IDs whose source file the
 * LLM is *currently* editing. The agent harness records active files in
 * useLlmEditActivityStore; here we map those files back to objects via each
 * object's resolved code location (merfolkData.codeFilePath / nodeCodeIndex),
 * mirroring objectCodeService.resolveCodeInfo + useObjectHasCode.
 *
 * Re-evaluates whenever the active-file set, the object list, the diagram
 * nodeCodeIndex, or the repo contents change.
 */
import { useMemo } from 'react';
import useObjectsStore from '../stores/objectsStore';
import useDiagramStore from '../stores/diagramStore';
import useCodeStore from '../stores/codeStore';
import useLlmEditActivityStore from '../stores/llmEditActivityStore';
import { resolveCodeInfo } from '../services/objectCodeService';

const normalizePath = (p) => (p || '').replace(/^\.\//, '').replace(/\\/g, '/');

export function useObjectsEditedByLlm() {
  const objects = useObjectsStore((s) => s.objects);
  const nodeCodeIndex = useDiagramStore((s) => s.nodeCodeIndex);
  const repoFileContents = useCodeStore((s) => s.repoFileContents);
  const activeFiles = useLlmEditActivityStore((s) => s.activeFiles);

  return useMemo(() => {
    const ids = new Set();
    if (!activeFiles || activeFiles.size === 0 || !objects || objects.length === 0) {
      return ids;
    }

    // Normalize active file paths once.
    const activeNormalized = new Set();
    for (const fp of activeFiles.keys()) {
      activeNormalized.add(normalizePath(fp));
    }

    for (const obj of objects) {
      const { filePath } = resolveCodeInfo(obj, nodeCodeIndex);
      if (!filePath) continue;
      if (activeNormalized.has(normalizePath(filePath))) {
        ids.add(obj.id);
      }
    }
    return ids;
    // repoFileContents is a re-evaluation trigger (resolveCodeInfo may consult
    // store-backed content); referenced to keep it in the dep list intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects, nodeCodeIndex, repoFileContents, activeFiles]);
}
