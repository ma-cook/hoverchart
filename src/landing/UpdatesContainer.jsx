import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import UpdatesViewer from './UpdatesViewer';

const UpdatesContainer = () => {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'devUpdates'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const updatesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUpdates(updatesList);
    });
  }, []);

  return (
    <div
      style={{
        maxHeight: '30vh',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.5) transparent',
        padding: '10px',
      }}
    >
      {updates.map((update) => (
        <div
          key={update.id}
          style={{
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '10px',
          }}
        >
          <UpdatesViewer
            content={update.content}
            timestamp={update.timestamp}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(UpdatesContainer);
