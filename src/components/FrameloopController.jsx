import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import useUIOverlayStore from '../stores/uiOverlayStore';
import useObjectsStore from '../stores/objectsStore';
import useLODStore from '../stores/lodStore';
import useSpatialManagerStore from '../stores/spatialManagerStore';
import useConnectionStore from '../stores/connectionStore';
import {
  getDesiredFrameloop,
  noteInteraction,
  registerRenderLoop,
  requestRender,
  setRenderLoopHidden,
  setRenderViewMode,
  unregisterRenderLoop,
} from '../utils/renderLoopGovernor';

/**
 * Controls the R3F render loop from inside the Canvas.
 *
 * The canvas stays in `demand` mode. While the user is interacting (or the
 * scene is still settling) the governor pumps one frame per display refresh;
 * once settled the pump stops, so a static scene costs no CPU/GPU at all and
 * only paints when something actually changes.
 */
function FrameloopController() {
  const viewMode = useUIOverlayStore((s) => s.viewMode);
  const gl = useThree((s) => s.gl);
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const frameloop = useThree((s) => s.frameloop);
  const clock = useThree((s) => s.clock);
  const lastActivityRef = useRef(0);
  const frameloopRef = useRef(frameloop);
  frameloopRef.current = frameloop;

  // Bridge the framework-free governor to R3F.
  useEffect(() => {
    registerRenderLoop({
      setFrameloop: (mode) => set({ frameloop: mode }),
      invalidate,
      getFrameloop: () => frameloopRef.current,
      // Demand frames stop advancing R3F's clock; consume the idle gap before
      // resuming so animations don't snap.
      consumeClockDelta: () => clock.getDelta(),
    });

    const canvas = gl.domElement;
    const note = (durationMs) => {
      lastActivityRef.current = performance.now();
      noteInteraction(durationMs);
    };
    const noteThrottled = () => {
      const now = performance.now();
      if (now - lastActivityRef.current < 50) return;
      note();
    };
    const onPointerDown = () => note();
    const onKeyDown = () => note();

    canvas?.addEventListener('pointerdown', onPointerDown, { passive: true });
    canvas?.addEventListener('pointermove', noteThrottled, { passive: true });
    canvas?.addEventListener('wheel', noteThrottled, { passive: true });
    canvas?.addEventListener('touchstart', onPointerDown, { passive: true });
    canvas?.addEventListener('touchmove', noteThrottled, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    const onVisibilityChange = () => setRenderLoopHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    setRenderLoopHidden(document.hidden);

    // Store changes that don't flow through a three.js prop still need a frame.
    const unsubscribers = [
      useObjectsStore.subscribe(() => requestRender()),
      useLODStore.subscribe(() => requestRender()),
      useSpatialManagerStore.subscribe(() => requestRender()),
      useConnectionStore.subscribe(() => requestRender()),
    ];

    // Safety net for any imperative path we missed. Keeps the scene correct
    // without restoring a continuous render loop.
    const fallbackId = window.setInterval(() => {
      if (!document.hidden && getDesiredFrameloop() === 'demand') {
        requestRender();
      }
    }, 5000);

    return () => {
      clearInterval(fallbackId);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas?.removeEventListener('pointerdown', onPointerDown);
      canvas?.removeEventListener('pointermove', noteThrottled);
      canvas?.removeEventListener('wheel', noteThrottled);
      canvas?.removeEventListener('touchstart', onPointerDown);
      canvas?.removeEventListener('touchmove', noteThrottled);
      window.removeEventListener('keydown', onKeyDown);
      unregisterRenderLoop();
    };
  }, [gl, set, invalidate, clock]);

  useEffect(() => {
    setRenderViewMode(viewMode);

    if (viewMode !== '3d') return undefined;

    // Pump a few extra frames to handle edge cases where the first frame
    // runs before React has flushed the visibility CSS change (so the GL
    // viewport is still 0×0).
    invalidate();

    const canvas = gl.domElement;
    if (canvas) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width > 0 && height > 0) {
        gl.setSize(width, height, false);
      }
    }

    const rafId = requestAnimationFrame(() => {
      invalidate();
      requestAnimationFrame(() => invalidate());
    });

    return () => cancelAnimationFrame(rafId);
  }, [viewMode, gl, invalidate]);

  // CanvasImpl re-applies its `frameloop` prop on re-render, which can drift
  // the store away from the governor's desired mode. Re-assert on drift only.
  useEffect(() => {
    const desired = getDesiredFrameloop();
    if (frameloop !== desired) {
      set({ frameloop: desired });
    }
  }, [frameloop, set]);

  // Keep the viewport correct after 2D visibility changes and DPR updates.
  useEffect(() => {
    if (viewMode !== '3d') return;
    const canvas = gl.domElement;
    if (!canvas) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width > 0 && height > 0) {
      gl.setSize(width, height, false);
    }
  }, [viewMode, size, gl]);

  return null;
}

export default FrameloopController;
