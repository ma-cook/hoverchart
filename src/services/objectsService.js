import { db } from '../firebase';
import { getDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

export const saveObjects = async (userId, objects) => {
  if (!userId) {
    console.error('saveObjects: Received invalid userId', userId);
    return;
  }
  try {
    await setDoc(doc(db, 'users', userId), {
      objects: objects,
      lastUpdated: Timestamp.fromDate(new Date()),
    });
  } catch (error) {
    console.error('Error saving objects:', error);
  }
};

export const loadObjects = async (userId) => {
  if (!userId) {
    console.error('loadObjects: Received invalid userId', userId);
    return [];
  }

  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Loaded data from Firestore:', data);
      return data.objects || [];
    }
    console.log('No data found for user:', userId);
    return [];
  } catch (error) {
    console.error('Error loading objects:', error);
    return [];
  }
};
