import { useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { usePublicSpaceStore } from '../stores';

const PublicSpaceView = ({ spaceId, ownerId, onViewSpace }) => {
  // Use public space store
  const getPublicSpace = usePublicSpaceStore((state) => state.getPublicSpace);
  const setPublicSpaceLoading = usePublicSpaceStore(
    (state) => state.setPublicSpaceLoading
  );
  const setPublicSpaceData = usePublicSpaceStore(
    (state) => state.setPublicSpaceData
  );
  const setPublicSpaceError = usePublicSpaceStore(
    (state) => state.setPublicSpaceError
  );

  const { spaceData, loading, error } = getPublicSpace(spaceId);
  useEffect(() => {
    const loadSpaceData = async () => {
      try {
        setPublicSpaceLoading(spaceId, true);
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (!spaceDoc.exists()) {
          setPublicSpaceError(spaceId, 'Space not found');
          return;
        }

        const data = spaceDoc.data();

        // Check if it's actually public
        const isPublic = data.sharedWith?.includes('everyone');

        if (!isPublic) {
          setPublicSpaceError(spaceId, 'This space is not publicly accessible');
          return;
        }

        setPublicSpaceData(spaceId, data);

        // Store necessary data for access
        window.publicAccessSpace = spaceId;
        window.currentSpaceOwner = ownerId;
      } catch (err) {
        console.error('Error loading space data:', err);
        setPublicSpaceError(spaceId, 'Failed to load space data');
      }
    };

    if (spaceId && ownerId) {
      loadSpaceData();
    }
  }, [
    spaceId,
    ownerId,
    setPublicSpaceLoading,
    setPublicSpaceData,
    setPublicSpaceError,
  ]);

  if (loading) return <div>Loading space information...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="public-space-view">
      <h2>Public Space: {spaceData.name}</h2>
      <p>Created by: {spaceData.ownerEmail}</p>

      <button onClick={onViewSpace}>View Space</button>
    </div>
  );
};

export default PublicSpaceView;
