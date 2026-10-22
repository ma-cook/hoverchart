/**
 * useObjectHasCode.js
 *
 * Reactive hook that reports whether a 3D object has a source-code association
 * that the code viewer can open. Re-evaluates whenever the diagram graph's
 * nodeCodeIndex changes, so objects created before the parser emitted
 * codeFilePath still resolve through their graph node.
 */
import { useMemo } from 'react';
import useDiagramStore from '../stores/diagramStore';
import { objectHasCode } from '../services/objectCodeService';

export function useObjectHasCode(objectData) {
  const nodeCodeIndex = useDiagramStore((s) => s.nodeCodeIndex);
  return useMemo(
    () => objectHasCode(objectData, { nodeCodeIndex }),
    [objectData, nodeCodeIndex]
  );
}