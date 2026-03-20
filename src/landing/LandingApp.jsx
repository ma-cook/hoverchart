// LandingApp.jsx — volscape landing/platform page, merged into hoverchart
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider, db, isValidFirebaseConfig } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { OrderHeader } from './Order';
import CustomCamera from './CustomCamera';
import WhitePlane from './WhitePlane';
import { Canvas } from '@react-three/fiber';

import CubeOutline from './CubeOutline';
import DodecahedronWireframe from './DodecahedronWireframe';
import DodecahedronWireframe2 from './components/DodecahedronWireframe2';

import { CreateSpacePopup } from './components/CreateSpacePopup';
import { ShareSpacePopup } from './components/ShareSpacePopup';
import { CreateOrganizationPopup } from './components/CreateOrganizationPopup';
import { SpacesTable } from './components/SpacesTable';
import { UserLoginSection } from './components/UserLoginSection';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { useWindowSize } from './hooks/useWindowSize';
import './LandingApp.css';

function LandingApp({ onOpenSpace, onBackToLanding }) {
  // Core state
  const [backgroundColor] = useState('white');
  const [user, setUser] = useState(null);
  const [lightColor] = useState('#fff4d2');
  const [glowColor] = useState('#fff4d2');

  // Window size custom hook
  const windowSize = useWindowSize();

  // Canvas ref
  const canvasRef = useRef(null);

  // Space management state
  const [showCreateSpacePopup, setShowCreateSpacePopup] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [sharedEmail, setSharedEmail] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [userSpaces, setUserSpaces] = useState({ owned: [], shared: [] });

  // Animation state
  const [showDodecahedron, setShowDodecahedron] = useState(true);
  const [showSecondCube, setShowSecondCube] = useState(true);

  // Share popup state
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedSpaceForSharing, setSelectedSpaceForSharing] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Organization state
  const [userOrgs, setUserOrgs] = useState([]);
  const [showCreateOrgPopup, setShowCreateOrgPopup] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Auth listener
  useEffect(() => {
    try {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    }
  }, []);

  // Load user spaces and orgs when user changes
  useEffect(() => {
    if (user) {
      fetchUserSpaces();
      fetchUserOrganizations();
    } else {
      setUserSpaces({ owned: [], shared: [] });
      setUserOrgs([]);
    }
  }, [user]);

  // User document creation/update helper
  const createUserDocument = useCallback(async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
      } else {
        await setDoc(
          userRef,
          { lastLogin: new Date().toISOString() },
          { merge: true }
        );
      }
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }, []);

  // Login handler
  const handleLogin = useCallback(async () => {
    if (!isValidFirebaseConfig) {
      alert(
        'Firebase authentication is not configured. This is a demo version.'
      );
      return;
    }

    try {
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      await createUserDocument(result.user);
    } catch (error) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-api-key') {
        alert(
          'Firebase is not configured properly. Please contact the administrator.'
        );
        return;
      }

      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this website to login');
      } else if (error.code === 'auth/cancelled-popup-request') {
        return;
      } else {
        alert('Login failed. Please try again.');
      }
    }
  }, [createUserDocument]);

  // Logout handler
  const handleLogout = useCallback(() => {
    signOut(auth)
      .then(() => {
        setUser(null);
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  }, []);

  // Navigate to a space — client-side transition, no redirect
  const navigateToSpace = useCallback(
    async (spaceId, ownerId = null) => {
      if (!user) return;
      const effectiveOwner =
        ownerId && ownerId !== user.uid ? ownerId : user.uid;
      if (onOpenSpace) {
        onOpenSpace(spaceId, effectiveOwner);
      }
    },
    [user, onOpenSpace]
  );

  // Fetch user spaces
  const fetchUserSpaces = useCallback(async () => {
    if (!user) return;

    console.log('Fetching user spaces for user:', user.uid);

    try {
      // Get owned spaces
      const userSpacesCollectionRef = collection(
        db,
        'users',
        user.uid,
        'spaces'
      );
      const spacesSnapshot = await getDocs(query(userSpacesCollectionRef));
      console.log('Found', spacesSnapshot.docs.length, 'owned spaces');

      const ownedSpaces = spacesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
      }));

      // Get shared spaces
      const sharedSpacesRef = collection(db, 'users', user.uid, 'sharedSpaces');
      const sharedSpacesSnapshot = await getDocs(sharedSpacesRef);
      console.log(
        'Found',
        sharedSpacesSnapshot.docs.length,
        'shared space references'
      );

      const sharedSpaces = [];

      for (const sharedSpaceDoc of sharedSpacesSnapshot.docs) {
        const sharedData = sharedSpaceDoc.data();
        const { spaceId, ownerId } = sharedData;

        try {
          const spaceRef = doc(db, 'users', ownerId, 'spaces', spaceId);
          const spaceDoc = await getDoc(spaceRef);

          if (spaceDoc.exists()) {
            sharedSpaces.push({
              id: spaceId,
              ownerId,
              ownerEmail: spaceDoc.data().ownerEmail,
              ...spaceDoc.data(),
              ...sharedData,
              isOwner: false,
              isShared: true,
            });
          } else {
            console.warn(
              `Shared space ${spaceId} no longer exists, removing stale reference`
            );
            await deleteDoc(
              doc(db, 'users', user.uid, 'sharedSpaces', spaceId)
            );
          }
        } catch (error) {
          console.warn(
            `Could not fetch shared space ${spaceId} from owner ${ownerId}:`,
            error
          );
        }
      }

      // MIGRATION: Check for legacy shared spaces
      console.log('Checking for legacy shared spaces...');
      const usersSnapshot = await getDocs(collection(db, 'users'));

      for (const userDoc of usersSnapshot.docs) {
        if (userDoc.id === user.uid) continue;

        try {
          const otherUserSpacesSnapshot = await getDocs(
            collection(db, 'users', userDoc.id, 'spaces')
          );

          for (const spaceDoc of otherUserSpacesSnapshot.docs) {
            const spaceData = spaceDoc.data();

            const isSharedWithCurrentUser =
              Array.isArray(spaceData.sharedWith) &&
              spaceData.sharedWith.some((share) => share.userId === user.uid);

            if (isSharedWithCurrentUser) {
              const existingRefDoc = await getDoc(
                doc(db, 'users', user.uid, 'sharedSpaces', spaceDoc.id)
              );

              if (!existingRefDoc.exists()) {
                console.log(
                  'Creating missing shared space reference for:',
                  spaceDoc.id
                );

                const sharedSpaceRef = doc(
                  db,
                  'users',
                  user.uid,
                  'sharedSpaces',
                  spaceDoc.id
                );
                await setDoc(sharedSpaceRef, {
                  spaceId: spaceDoc.id,
                  ownerId: userDoc.id,
                  permissions: ['view', 'edit'],
                  sharedAt: new Date().toISOString(),
                  migratedAt: new Date().toISOString(),
                });

                sharedSpaces.push({
                  id: spaceDoc.id,
                  ownerId: userDoc.id,
                  ownerEmail: spaceData.ownerEmail,
                  ...spaceData,
                  spaceId: spaceDoc.id,
                  permissions: ['view', 'edit'],
                  sharedAt: new Date().toISOString(),
                  migratedAt: new Date().toISOString(),
                  isOwner: false,
                  isShared: true,
                });
              }
            }
          }
        } catch (error) {
          console.warn(`Could not check spaces for user ${userDoc.id}:`, error);
        }
      }

      console.log('Setting user spaces state:', {
        ownedCount: ownedSpaces.length,
        sharedCount: sharedSpaces.length,
      });
      setUserSpaces({
        owned: ownedSpaces,
        shared: sharedSpaces,
      });
    } catch (error) {
      console.error('Error fetching user spaces:', error);
    }
  }, [user]);

  // Fetch organizations for the current user
  const fetchUserOrganizations = useCallback(async () => {
    if (!user) return;

    try {
      const orgsRef = collection(db, 'organizations');
      const q = query(orgsRef, where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      const orgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserOrgs(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  }, [user]);

  // Create a new organization
  const createOrganization = useCallback(
    async (orgName) => {
      if (!user || !orgName.trim()) return;

      try {
        setIsCreatingOrg(true);

        const orgData = {
          name: orgName.trim(),
          ownerId: user.uid,
          ownerEmail: user.email,
          members: [],
          createdAt: new Date().toISOString(),
          timestamp: Date.now(),
        };

        await addDoc(collection(db, 'organizations'), orgData);

        setShowCreateOrgPopup(false);
        await fetchUserOrganizations();
      } catch (error) {
        console.error('Error creating organization:', error);
        alert('Failed to create organization. Please try again.');
        throw error;
      } finally {
        setIsCreatingOrg(false);
      }
    },
    [fetchUserOrganizations, user]
  );

  // Create new space
  const createNewSpace = useCallback(
    async (spaceName, email) => {
      const finalSpaceName = spaceName || newSpaceName;
      const finalEmail = email || sharedEmail;

      if (!user || !finalSpaceName.trim()) {
        return Promise.reject(
          new Error('User not logged in or space name empty')
        );
      }

      try {
        setIsCreatingSpace(true);

        const timestamp = Date.now();
        const spaceData = {
          name: finalSpaceName.trim(),
          ownerId: user.uid,
          ownerEmail: user.email,
          createdAt: new Date().toISOString(),
          timestamp,
          sharedWith: [],
        };

        if (finalEmail?.trim()) {
          const usersRef = collection(db, 'users');
          const userQuery = query(
            usersRef,
            where('email', '==', finalEmail.trim())
          );
          const querySnapshot = await getDocs(userQuery);

          if (!querySnapshot.empty) {
            const sharedUserId = querySnapshot.docs[0].id;
            spaceData.sharedWith = [
              {
                userId: sharedUserId,
                email: finalEmail.trim(),
                permissions: ['view', 'edit'],
              },
            ];
          } else {
            alert(
              `User with email ${finalEmail} was not found. Space created without sharing.`
            );
          }
        }

        const spacesRef = collection(db, 'users', user.uid, 'spaces');
        await addDoc(spacesRef, spaceData);

        setNewSpaceName('');
        setSharedEmail('');
        setShowCreateSpacePopup(false);
        await fetchUserSpaces();

        return true;
      } catch (error) {
        console.error('Error creating space:', error);

        if (error.code === 'already-exists') {
          alert(
            'A space with this name already exists. Please try a different name.'
          );
        } else {
          alert('Failed to create space. Please try again.');
        }

        throw error;
      } finally {
        setIsCreatingSpace(false);
      }
    },
    [fetchUserSpaces, newSpaceName, sharedEmail, user]
  );

  // Share space with another user
  const handleShareSpace = useCallback(
    async (emailOrEveryone) => {
      if (!selectedSpaceForSharing) return;

      try {
        setIsSharing(true);
        setShareError('');

        if (emailOrEveryone === 'everyone') {
          const spaceRef = doc(
            db,
            'users',
            user.uid,
            'spaces',
            selectedSpaceForSharing.id
          );

          const spaceDoc = await getDoc(spaceRef);
          if (!spaceDoc.exists()) {
            setShareError('Space no longer exists');
            setIsSharing(false);
            return;
          }

          await setDoc(
            spaceRef,
            {
              sharedWith: ['everyone'],
              isPublic: true,
            },
            { merge: true }
          );

          const publicSpaceRef = doc(
            db,
            'publicSpaces',
            selectedSpaceForSharing.id
          );
          await setDoc(publicSpaceRef, {
            spaceId: selectedSpaceForSharing.id,
            ownerId: user.uid,
            ownerEmail: user.email,
            name: spaceDoc.data().name,
            createdAt: spaceDoc.data().createdAt,
            madePublicAt: new Date().toISOString(),
          });

          setShowSharePopup(false);
          setShareEmail('');
          setSelectedSpaceForSharing(null);
          await fetchUserSpaces();
          return;
        }

        const shareEmailToUse = emailOrEveryone;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(shareEmailToUse.trim())) {
          setShareError('Please enter a valid email address');
          setIsSharing(false);
          return;
        }

        const usersRef = collection(db, 'users');
        const userQuery = query(
          usersRef,
          where('email', '==', shareEmailToUse.trim())
        );
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
          setShareError(`No user found with email ${shareEmailToUse}`);
          setIsSharing(false);
          return;
        }

        const sharedUserId = querySnapshot.docs[0].id;

        if (sharedUserId === user.uid) {
          setShareError("You can't share a space with yourself");
          setIsSharing(false);
          return;
        }

        const spaceRef = doc(
          db,
          'users',
          user.uid,
          'spaces',
          selectedSpaceForSharing.id
        );
        const spaceDoc = await getDoc(spaceRef);

        if (!spaceDoc.exists()) {
          setShareError('Space no longer exists');
          setIsSharing(false);
          return;
        }

        const spaceData = spaceDoc.data();
        let sharedWith = spaceData.sharedWith || [];

        const isPublic = spaceData.isPublic === true;
        if (isPublic || sharedWith.includes('everyone')) {
          sharedWith = [];
        }

        const alreadyShared = sharedWith.some(
          (share) =>
            share.userId === sharedUserId ||
            (typeof share === 'object' && share.userId === sharedUserId)
        );

        if (alreadyShared) {
          setShareError(`Space is already shared with ${shareEmailToUse}`);
          setIsSharing(false);
          return;
        }

        sharedWith.push({
          userId: sharedUserId,
          email: shareEmailToUse.trim(),
          permissions: ['view', 'edit'],
        });

        await setDoc(
          spaceRef,
          {
            sharedWith,
            isPublic: false,
          },
          { merge: true }
        );

        try {
          const publicSpaceRef = doc(
            db,
            'publicSpaces',
            selectedSpaceForSharing.id
          );
          await deleteDoc(publicSpaceRef);
        } catch (publicError) {
          console.log(
            'Space was not in public collection (this is normal):',
            publicError.message
          );
        }

        const sharedSpaceRef = doc(
          db,
          'users',
          sharedUserId,
          'sharedSpaces',
          selectedSpaceForSharing.id
        );
        await setDoc(sharedSpaceRef, {
          spaceId: selectedSpaceForSharing.id,
          ownerId: user.uid,
          permissions: ['view', 'edit'],
          sharedAt: new Date().toISOString(),
        });

        setShowSharePopup(false);
        setShareEmail('');
        setSelectedSpaceForSharing(null);
        await fetchUserSpaces();
      } catch (error) {
        console.error('Error sharing space:', error);
        setShareError('Failed to share space. Please try again.');
      } finally {
        setIsSharing(false);
      }
    },
    [fetchUserSpaces, selectedSpaceForSharing, user?.uid]
  );

  // Delete space
  const handleDeleteSpace = useCallback(
    async (spaceId) => {
      if (!user || !spaceId || isDeleting) return;

      if (
        !window.confirm(
          'Are you sure you want to delete this space? This cannot be undone.'
        )
      ) {
        return;
      }

      try {
        setIsDeleting(true);
        console.log('Starting delete process for spaceId:', spaceId);

        const spaceRef = doc(db, 'users', user.uid, 'spaces', spaceId);
        const spaceDoc = await getDoc(spaceRef);

        if (spaceDoc.exists()) {
          const spaceData = spaceDoc.data();

          if (Array.isArray(spaceData.sharedWith)) {
            for (const share of spaceData.sharedWith) {
              if (share.userId) {
                try {
                  const sharedSpaceRef = doc(
                    db,
                    'users',
                    share.userId,
                    'sharedSpaces',
                    spaceId
                  );
                  await deleteDoc(sharedSpaceRef);
                } catch (shareError) {
                  console.warn(
                    'Failed to remove shared space reference for user',
                    share.userId,
                    shareError
                  );
                }
              }
            }
          }

          await deleteDoc(spaceRef);

          try {
            const topLevelSpaceRef = doc(db, 'spaces', spaceId);
            await deleteDoc(topLevelSpaceRef);
          } catch (topLevelError) {
            console.log(
              'No top-level space to delete (this is normal):',
              topLevelError.message
            );
          }

          if (spaceData.isPublic) {
            try {
              const publicSpaceRef = doc(db, 'publicSpaces', spaceId);
              await deleteDoc(publicSpaceRef);
            } catch (publicError) {
              console.log(
                'Could not remove from public spaces:',
                publicError.message
              );
            }
          }
        } else {
          alert(
            'Space not found in database. It may have already been deleted.'
          );
        }

        await fetchUserSpaces();
      } catch (error) {
        console.error('Error deleting space:', error);
        alert(`Failed to delete space: ${error.message}. Please try again.`);
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchUserSpaces, isDeleting, user]
  );

  // Leave a shared space
  const handleLeaveSpace = useCallback(
    async (space) => {
      if (!user || !space || !space.ownerId) return;

      if (
        !window.confirm(
          `Are you sure you want to leave "${space.name}"? You will lose access to this space.`
        )
      ) {
        return;
      }

      try {
        setIsDeleting(true);

        const sharedSpaceRef = doc(
          db,
          'users',
          user.uid,
          'sharedSpaces',
          space.id
        );
        await deleteDoc(sharedSpaceRef);

        try {
          const originalSpaceRef = doc(
            db,
            'users',
            space.ownerId,
            'spaces',
            space.id
          );
          const originalSpaceDoc = await getDoc(originalSpaceRef);

          if (originalSpaceDoc.exists()) {
            const spaceData = originalSpaceDoc.data();
            const updatedSharedWith = (spaceData.sharedWith || []).filter(
              (share) => share.userId !== user.uid
            );

            await setDoc(
              originalSpaceRef,
              { sharedWith: updatedSharedWith },
              { merge: true }
            );
          }
        } catch (updateError) {
          console.log(
            'Could not update original space (this is okay):',
            updateError.message
          );
        }

        await fetchUserSpaces();
        alert(`You have left "${space.name}".`);
      } catch (error) {
        console.error('Error leaving space:', error);
        alert('Failed to leave space. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchUserSpaces, user]
  );

  // Animation completion handlers
  const handleFirstCubeComplete = useCallback(() => {
    setShowDodecahedron(true);
  }, []);

  const handleDodecahedronComplete = useCallback(() => {
    setShowSecondCube(true);
  }, []);

  // Derived state for login/spaces UI
  const spaceTableProps = useMemo(
    () => ({
      userSpaces,
      userOrgs,
      windowSize,
      user,
      isDeleting,
      onNavigateToSpace: navigateToSpace,
      onCreateSpace: () => setShowCreateSpacePopup(true),
      onShareSpace: (space) => {
        setSelectedSpaceForSharing(space);
        setShowSharePopup(true);
      },
      onDeleteSpace: handleDeleteSpace,
      onLeaveSpace: handleLeaveSpace,
      onCreateOrganization: () => setShowCreateOrgPopup(true),
    }),
    [
      userSpaces,
      userOrgs,
      windowSize,
      user,
      isDeleting,
      navigateToSpace,
      handleDeleteSpace,
      handleLeaveSpace,
    ]
  );

  // Props for the create organization popup
  const createOrgProps = useMemo(
    () => ({
      show: showCreateOrgPopup,
      isCreating: isCreatingOrg,
      onCancel: () => setShowCreateOrgPopup(false),
      onSubmit: createOrganization,
    }),
    [showCreateOrgPopup, isCreatingOrg, createOrganization]
  );

  // Props for the create space popup
  const createSpaceProps = useMemo(
    () => ({
      show: showCreateSpacePopup,
      initialSpaceName: newSpaceName,
      initialEmail: sharedEmail,
      isCreating: isCreatingSpace,
      onCancel: () => {
        setShowCreateSpacePopup(false);
        setNewSpaceName('');
        setSharedEmail('');
      },
      onSubmit: createNewSpace,
    }),
    [
      showCreateSpacePopup,
      newSpaceName,
      sharedEmail,
      isCreatingSpace,
      createNewSpace,
    ]
  );

  // Props for share popup
  const sharePopupProps = useMemo(
    () => ({
      show: showSharePopup,
      space: selectedSpaceForSharing,
      email: shareEmail,
      isSharing,
      error: shareError,
      onChangeEmail: setShareEmail,
      onCancel: () => {
        setShowSharePopup(false);
        setShareEmail('');
        setSelectedSpaceForSharing(null);
        setShareError('');
      },
      onShare: handleShareSpace,
    }),
    [
      handleShareSpace,
      isSharing,
      selectedSpaceForSharing,
      shareEmail,
      shareError,
      showSharePopup,
    ]
  );

  return (
    <div
      className="landing-view"
      style={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        backgroundColor: 'white',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Modals */}
      <CreateSpacePopup {...createSpaceProps} />
      <ShareSpacePopup {...sharePopupProps} />
      <CreateOrganizationPopup {...createOrgProps} />

      {/* Spaces container */}
      {user && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: (() => {
              if (windowSize.width <= 480) return '95%';
              if (windowSize.width <= 768) return '90%';
              if (windowSize.width <= 1200) return '75%';
              return '65%';
            })(),
            maxWidth: '80rem',
            maxHeight: '80vh',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            zIndex: 10,
            display: 'flex',
            padding: windowSize.width > 768 ? '1.5rem' : '0.75rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            overflow: 'auto',
          }}
        >
          <SpacesTable {...spaceTableProps} />
        </div>
      )}

      {/* Login/user section */}
      {user && (
        <UserLoginSection
          user={user}
          windowSize={windowSize}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      {/* Welcome overlay */}
      {!user && (
        <WelcomeOverlay windowSize={windowSize} onLogin={handleLogin} />
      )}

      {/* 3D Canvas */}
      <Canvas
        ref={canvasRef}
        style={{
          background: backgroundColor,
          width: '100%',
          height: '100%',
        }}
        resize={{ scroll: false }}
        antialias="true"
        pixelratio={window.devicePixelRatio}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={[backgroundColor, 10, 300]} />
        <ambientLight intensity={2} />
        <OrderHeader windowSize={windowSize} />

        <CustomCamera />
        <WhitePlane />

        {/* Only render 3D objects when user is NOT logged in */}
        {!user && (
          <>
            <CubeOutline
              size={10}
              color="#333333"
              targetPosition={[-100, 40, 400]}
              visible={true}
              onAnimationComplete={handleFirstCubeComplete}
            />

            <DodecahedronWireframe
              size={10}
              color="#333333"
              targetPosition={[-80, -10, 440]}
              visible={true}
              onAnimationComplete={handleDodecahedronComplete}
            />
            <DodecahedronWireframe2
              size={10}
              color="#333333"
              targetPosition={[80, -10, 440]}
              visible={true}
              onAnimationComplete={handleDodecahedronComplete}
            />

            <CubeOutline
              size={10}
              color="#333333"
              targetPosition={[100, 40, 400]}
              visible={true}
              textLabel="Wireframe"
              isLastObject={true}
            />
          </>
        )}
      </Canvas>
    </div>
  );
}

export default React.memo(LandingApp);
