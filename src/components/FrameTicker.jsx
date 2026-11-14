import { useFrame } from '@react-three/fiber';
import { frameCounter } from '../utils/frameCounter';
import { recordFrameTime } from '../utils/renderWorkScheduler';

/**
 * Global frame ticker that runs once per frame
 * This updates the frameCounter singleton that all components can reference
 * instead of each component calling Date.now() individually
 */
function FrameTicker() {
  useFrame(() => {
    frameCounter.tick();
    recordFrameTime();
  });

  return null; // This component renders nothing
}

export default FrameTicker;
