import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const PublicSpaceView = ({ spaceId, ownerId, onViewSpace }) => {
  const [spaceData, setSpaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSpaceData = async () => {
      try {
        setLoading(true);
        const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (!spaceDoc.exists()) {
          setError('Space not found');
          setLoading(false);
          return;
        }

        const data = spaceDoc.data();

        // Check if it's actually public
        const isPublic = data.sharedWith?.includes('everyone');

        if (!isPublic) {
          setError('This space is not publicly accessible');
          setLoading(false);
          return;
        }

        setSpaceData(data);
        setLoading(false);

        // Store necessary data for access
        window.publicAccessSpace = spaceId;
        window.currentSpaceOwner = ownerId;
      } catch (err) {
        console.error('Error loading space data:', err);
        setError('Failed to load space data');
        setLoading(false);
      }
    };

    if (spaceId && ownerId) {
      loadSpaceData();
    }
  }, [spaceId, ownerId]);

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
