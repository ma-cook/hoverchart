import { OrderHeader } from './Order';
import CustomCamera from './CustomCamera';
import PerspectiveGrid from './PerspectiveGrid';

const LandingScene = ({ user, scrollProgressRef, windowSize }) => (
  <>
    <ambientLight intensity={2} />
    {!user && <OrderHeader windowSize={windowSize} />}
    <CustomCamera scrollProgressRef={!user ? scrollProgressRef : null} />
    <PerspectiveGrid />
  </>
);

export default LandingScene;
