import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { isCameraMovingWithin } from '../utils/renderWorkScheduler';
import { requestRender, subscribeRenderSettled } from '../utils/renderLoopGovernor';
import useRenderQualityStore from '../stores/renderQualityStore';

const MIN_DPR = 1;
const SLOW_FRAME_MS = 28;
const FAST_FRAME_MS = 19;
const STEP_DOWN_AFTER_MS = 500;
const STEP_UP_AFTER_MS = 1200;
const CHANGE_COOLDOWN_MS = 600;
const IDLE_RESTORE_MS = 500;

function buildDprSteps(maxDpr) {
  const steps = [];
  const floor = Math.min(MIN_DPR, maxDpr);
  for (let dpr = maxDpr; dpr > floor + 0.01; dpr -= 0.25) {
    steps.push(Math.round(dpr * 100) / 100);
  }
  steps.push(floor);
  return [...new Set(steps)];
}

/**
 * Adaptive DPR controller.
 *
 * Lowers the render resolution during orbit/drag and whenever sustained frame
 * times exceed the target, then gradually restores full resolution once the
 * scene is settled and fast again. This attacks the two costs that dominate
 * the trace: pixels shaded/committed and draw-call submission time.
 */
function AdaptiveQuality() {
  const setR3fDpr = useThree((s) => s.setDpr);
  const setStoreDpr = useRenderQualityStore((s) => s.setDpr);
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  const steps = useMemo(() => buildDprSteps(maxDpr), [maxDpr]);
  const stepRef = useRef(0);
  const frameMsRef = useRef(16);
  const slowAccumRef = useRef(0);
  const fastAccumRef = useRef(0);
  const lastChangeRef = useRef(0);
  const degradedRef = useRef(false);
  const lastFrameAtRef = useRef(0);
  const idleRestoreTimerRef = useRef(null);

  const applyDpr = useCallback(
    (value) => {
      // Apply immediately for the next frame, and keep SharedCanvas's `dpr`
      // prop in sync so R3F's configure() cannot reset it on a canvas re-render.
      setR3fDpr(value);
      setStoreDpr(value);
    },
    [setR3fDpr, setStoreDpr]
  );

  const clearIdleRestore = useCallback(() => {
    if (idleRestoreTimerRef.current !== null) {
      clearTimeout(idleRestoreTimerRef.current);
      idleRestoreTimerRef.current = null;
    }
  }, []);

  const restoreFullQuality = useCallback(() => {
    if (stepRef.current === 0) return;
    clearIdleRestore();
    stepRef.current = 0;
    frameMsRef.current = 16;
    slowAccumRef.current = 0;
    fastAccumRef.current = 0;
    degradedRef.current = false;
    useRenderQualityStore.getState().setDegraded(false);
    applyDpr(maxDpr);
    requestRender();
  }, [applyDpr, clearIdleRestore, maxDpr]);

  // Safety net for self-invalidating animations (connection dashes, video,
  // LLM pulses) that keep frames coming while the governor considers the scene
  // idle. Restores full resolution once frames have actually stopped.
  const ensureIdleRestore = useCallback(() => {
    if (idleRestoreTimerRef.current !== null) return;

    const check = () => {
      idleRestoreTimerRef.current = null;
      if (stepRef.current === 0) return;
      const idleFor = performance.now() - lastFrameAtRef.current;
      if (idleFor >= IDLE_RESTORE_MS) {
        restoreFullQuality();
        return;
      }
      idleRestoreTimerRef.current = setTimeout(
        check,
        Math.max(50, IDLE_RESTORE_MS - idleFor)
      );
    };

    idleRestoreTimerRef.current = setTimeout(check, IDLE_RESTORE_MS);
  }, [restoreFullQuality]);

  useEffect(
    () => () => {
      // Best-effort restore when the 3D scene unmounts.
      clearIdleRestore();
      try {
        setR3fDpr(maxDpr);
      } catch {
        /* renderer already disposed */
      }
      setStoreDpr(maxDpr);
      useRenderQualityStore.getState().setDegraded(false);
    },
    [clearIdleRestore, setR3fDpr, setStoreDpr, maxDpr]
  );

  // Once the scene settles, paint one final full-resolution frame. Without
  // this the last rendered image would stay at the reduced motion resolution
  // because no further frames run in demand mode.
  useEffect(() => subscribeRenderSettled(restoreFullQuality), [restoreFullQuality]);

  useFrame((_, delta) => {
    // Track rendered frames so the idle-restore safety net can tell when a
    // self-invalidating animation has actually stopped.
    if (stepRef.current > 0) {
      lastFrameAtRef.current = performance.now();
    }

    const frameMs = Math.min(delta * 1000, 250);

    // Ignore tab-resume / demand-heartbeat gaps; they are not real frame cost.
    if (frameMs <= 0 || frameMs > 240) {
      frameMsRef.current = 16;
      slowAccumRef.current = 0;
      fastAccumRef.current = 0;
      return;
    }

    frameMsRef.current = frameMsRef.current * 0.88 + frameMs * 0.12;
    const now = performance.now();
    const moving = isCameraMovingWithin(250);
    const current = stepRef.current;
    const last = steps.length - 1;

    const applyStep = (next) => {
      const clamped = Math.max(0, Math.min(last, next));
      if (clamped === stepRef.current) return;
      stepRef.current = clamped;
      lastChangeRef.current = now;
      slowAccumRef.current = 0;
      fastAccumRef.current = 0;
      applyDpr(steps[clamped]);
      const degraded = clamped > 0;
      if (degraded) {
        lastFrameAtRef.current = performance.now();
        ensureIdleRestore();
      } else {
        clearIdleRestore();
      }
      if (degraded !== degradedRef.current) {
        degradedRef.current = degraded;
        useRenderQualityStore.getState().setDegraded(degraded);
      }
    };

    // Start shedding resolution as soon as the camera starts moving, before
    // frame time has already collapsed.
    if (moving && current === 0 && last > 0) {
      applyStep(1);
      return;
    }

    const slow = frameMsRef.current > SLOW_FRAME_MS;
    const fast = frameMsRef.current < FAST_FRAME_MS;

    if (slow) {
      fastAccumRef.current = 0;
      slowAccumRef.current += frameMs;
      if (
        slowAccumRef.current >= STEP_DOWN_AFTER_MS &&
        now - lastChangeRef.current >= CHANGE_COOLDOWN_MS
      ) {
        // Very slow frames jump straight to the floor; moderate slowdowns
        // step down gradually to avoid a visibly obvious resolution change.
        const next = frameMsRef.current > 45 ? last : current + 1;
        applyStep(next);
      }
    } else if (fast && !moving) {
      slowAccumRef.current = 0;
      fastAccumRef.current += frameMs;
      if (
        fastAccumRef.current >= STEP_UP_AFTER_MS &&
        now - lastChangeRef.current >= CHANGE_COOLDOWN_MS
      ) {
        applyStep(current - 1);
      }
    } else {
      slowAccumRef.current = 0;
      fastAccumRef.current = 0;
    }
  });

  return null;
}

export default AdaptiveQuality;
