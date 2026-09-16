/**
 * useObjectHasCode.js
 *
 * Reactive hook that reports whether a 3D object has source code available for
 * the code viewer (metadata.code, repoFileContents, or a chunked content-store
 * entry for its codeFilePath). Re-evaluates whenever the code store's
 * repoFileContents map changes (e.g. right after a repo scan or on IndexedDB
 * hydration) so the `</>` button appears as soon as contents exist.
 */
import { useMemo } from 'react';
import useCodeStore from '../stores/codeStore';
import { objectHasCode } from '../services/objectCodeService';

export function useObjectHasCode(objectData) {
  const repoFileContents = useCodeStore((s) => s.repoFileContents);
  return useMemo(
    () => objectHasCode(objectData, { repoFileContents }),
    [objectData, repoFileContents]
  );
}