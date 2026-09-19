/**
 * useObjectHasCode.js
 *
 * Reactive hook that reports whether a 3D object has source code available for
 * the code viewer (metadata.code, repoFileContents, or a chunked content-store
 * entry for its codeFilePath). Re-evaluates whenever the code store's
 * repoFileContents map changes (e.g. right after a repo scan or on IndexedDB
 * hydration), the diagram graph's nodeCodeIndex changes (so objects created
 * before the parser emitted codeFilePath still resolve through their graph
 * node), OR the ContentStore's repo: entries change, so the `</>` button
 * appears as soon as contents exist.
 */
import { useMemo, useSyncExternalStore } from 'react';
import useCodeStore from '../stores/codeStore';
import useDiagramStore from '../stores/diagramStore';
import { objectHasCode } from '../services/objectCodeService';
import { subscribeToRepoContent, getRepoContentVersion } from '../services/context/repoContentSignal';

export function useObjectHasCode(objectData) {
  const repoFileContents = useCodeStore((s) => s.repoFileContents);
  const nodeCodeIndex = useDiagramStore((s) => s.nodeCodeIndex);
  const contentVersion = useSyncExternalStore(
    subscribeToRepoContent,
    getRepoContentVersion
  );
  return useMemo(() => {
    // contentVersion is a re-evaluation trigger for ContentStore changes; the
    // actual entry lookup happens lazily inside objectHasCode via getEntry.
    void contentVersion;
    return objectHasCode(objectData, { repoFileContents, nodeCodeIndex });
  }, [objectData, repoFileContents, nodeCodeIndex, contentVersion]);
}