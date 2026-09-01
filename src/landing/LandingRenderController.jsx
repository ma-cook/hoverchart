import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import useSceneStore from '../stores/sceneStore';

/**
 * Pauses the R3F render loop while the landing page is shown.
 *
 * The shared Canvas defaults to frameloop "always" and the app's only
 * render-loop controller (FrameloopController) lives inside DiagramApp, which
 * is unmounted on the landing page — so the static landing scene used to be
 * re-rendered at 60fps for the entire visit. This controller drops it to
 * "never" and re-renders on demand:
 *   – one frame when the user scrolls (landingScrollVersion bump)
 *   – one frame on window resize (Camera/OrderHeader re-position)
 *   – subsequent frames while CustomCamera's lerp is still converging
 * It restores "always" on unmount so the diagram app keeps its continuous loop.
 *
 * Note: R3F's CanvasImpl re-applies its `frameloop` prop (SharedCanvas passes
 * "always") on every canvas re-render via a deps-less configure() effect,
 * which would silently restart the perpetual render loop. The effect below
 * therefore re-asserts "never" whenever the store drifts away from it, so a
 * single re-assertion settles the loop instead of letting it spin at display
 * refresh rate for the whole visit.
 */
function LandingRenderController() {
  const set = useThree((s) => s.set);
  const invalidate = useThree((s) => s.invalidate);
  const frameloop = useThree((s) => s.frameloop);
  const landingScrollVersion = useSceneStore((s) => s.landingScrollVersion);

  useEffect(() => {
    if (frameloop !== 'never') {
      set({ frameloop: 'never' });
    }
    return () => set({ frameloop: 'always' });
  }, [frameloop, set]);

  useEffect(() => {
    invalidate();
  }, [landingScrollVersion, invalidate]);

  useEffect(() => {
    const handleResize = () => invalidate();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [invalidate]);

  return null;
}

export default LandingRenderController;
