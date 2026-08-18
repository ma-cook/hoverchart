import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useUIOverlayStore from '../stores/uiOverlayStore';

/**
 * Controls the R3F render loop from inside the Canvas.
 * Pauses rendering when the 2D overlay is active and reliably
 * restarts it when switching back to 3D — bypassing the known
 * issue where changing the Canvas `frameloop` prop externally
 * doesn't restart the internal requestAnimationFrame loop.
 */
function FrameloopController() {
  const viewMode = useUIOverlayStore((s) => s.viewMode);
  const gl = useThree((s) => s.gl);
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);

  useEffect(() => {
    if (viewMode === '3d') {
      set({ frameloop: 'always' });

      // Pump a few extra frames to handle edge cases where the first frame
      // runs before React has flushed the visibility CSS change (so the GL
      // viewport is still 0×0).
      invalidate();

      // Force the WebGL renderer to reclaim the correct viewport size.
      // While the wrapper div was visibility:hidden some browsers collapse
      // layout, leaving the renderer with a stale (or zero) viewport.
      const canvas = gl.domElement;
      if (canvas) {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (width > 0 && height > 0) {
          gl.setSize(width, height, false);
        }
      }

      // Pump a few extra invalidation frames after a microtask so the
      // browser has had time to recalc layout after visibility changes.
      const rafId = requestAnimationFrame(() => {
        invalidate();
        requestAnimationFrame(() => invalidate());
      });

      return () => cancelAnimationFrame(rafId);
    } else {
      set({ frameloop: 'never' });
    }
  }, [viewMode, gl, set, invalidate, size]);

  return null;
}

export default FrameloopController;
