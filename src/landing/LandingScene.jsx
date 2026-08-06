import { OrderHeader } from './Order';
import CustomCamera from './CustomCamera';
import PerspectiveGrid from './PerspectiveGrid';
import LandingRenderController from './LandingRenderController';

const LandingScene = ({ user, scrollProgressRef, windowSize }) => (
  <>
    <LandingRenderController />
    <ambientLight intensity={2} />
    {!user && <OrderHeader windowSize={windowSize} />}
    <CustomCamera scrollProgressRef={!user ? scrollProgressRef : null} />
    <PerspectiveGrid />
  </>
);

export default LandingScene;
