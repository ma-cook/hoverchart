// LandingApp.jsx — volscape landing/platform page, merged into hoverchart
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
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
import LandingScene from './LandingScene';
import useSceneStore from '../stores/sceneStore';

import { CreateSpacePopup } from './components/CreateSpacePopup';
import { ShareSpacePopup } from './components/ShareSpacePopup';
import { SpacesTable } from './components/SpacesTable';
import LandingTopBar from './components/LandingTopBar';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { OrganizationManager } from './components/OrganizationManager';
import { UpgradePrompt, TIER_LIMITS } from './components/UpgradePrompt';
import {
  getUserOrganizations,
  getOrganizationMembers,
  getPendingInvitesForUser,
  acceptInvite,
  declineInvite,
} from '../services/organizationService';
import { useWindowSize } from './hooks/useWindowSize';
import { LandingScrollContent } from './components/LandingScrollContent';
import './LandingApp.css';
import '../components/TopBar.css';

function LandingApp({ onOpenSpace, onTryWithoutAccount }) {
  // Core state
  const [backgroundColor] = useState('white');
  const [user, setUser] = useState(null);
  const [lightColor] = useState('#fff4d2');
  const [glowColor] = useState('#fff4d2');

  // Window size custom hook
  const windowSize = useWindowSize();

  // Space management state
  const [showCreateSpacePopup, setShowCreateSpacePopup] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [accountTier, setAccountTier] = useState('free');
  const [newSpaceName, setNewSpaceName] = useState('');
  const [sharedEmail, setSharedEmail] = useState('');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [userSpaces, setUserSpaces] = useState({ owned: [], shared: [] });

  // Scroll-driven camera and overlay progression
  const MAX_SCROLL = 3000;
  const rawScrollRef = useRef(0);
  const touchStartYRef = useRef(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  // Ref so camera reads scroll every R3F frame without waiting for React re-renders
  const scrollProgressRef = useRef(0);
  const rafPendingRef = useRef(null);

  // Feed 3D scene to the shared Canvas via store
  const setLandingScene = useSceneStore((s) => s.setLandingScene);
  useEffect(() => {
    setLandingScene(
      <LandingScene
        user={user}
        scrollProgressRef={scrollProgressRef}
        windowSize={windowSize}
      />
    );
    return () => setLandingScene(null);
  }, [user, scrollProgressRef, windowSize, setLandingScene]);

  // Update ref immediately (for camera) and throttle state update to one rAF per frame
  // (for overlay panels) — prevents 10-20 re-renders per scroll gesture
  const scheduleScrollUpdate = useCallback((value) => {
    scrollProgressRef.current = value;
    if (!rafPendingRef.current) {
      rafPendingRef.current = requestAnimationFrame(() => {
        setScrollProgress(scrollProgressRef.current);
        rafPendingRef.current = null;
      });
    }
  }, []);

  // Wheel handler — intercepts scroll to drive camera/overlays
  useEffect(() => {
    if (user) {
      rawScrollRef.current = 0;
      scrollProgressRef.current = 0;
      setScrollProgress(0);
      return;
    }
    const handleWheel = (e) => {
      e.preventDefault();
      rawScrollRef.current = Math.max(0, Math.min(MAX_SCROLL, rawScrollRef.current + e.deltaY));
      scheduleScrollUpdate(rawScrollRef.current / MAX_SCROLL);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [user, scheduleScrollUpdate]);

  // Touch handler for mobile scroll
  useEffect(() => {
    if (user) return;
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const delta = touchStartYRef.current - e.touches[0].clientY;
      touchStartYRef.current = e.touches[0].clientY;
      rawScrollRef.current = Math.max(0, Math.min(MAX_SCROLL, rawScrollRef.current + delta * 1.5));
      scheduleScrollUpdate(rawScrollRef.current / MAX_SCROLL);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [user, scheduleScrollUpdate]);

  // Share popup state
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedSpaceForSharing, setSelectedSpaceForSharing] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Organization state
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [activeOrgMembers, setActiveOrgMembers] = useState([]);
  const [showOrgManager, setShowOrgManager] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

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

  // Complete a pending signInWithRedirect on mount. When the user returns
  // from Google after a redirect sign-in, Firebase exposes the result via
  // getRedirectResult — we capture it here so the rest of the app sees the
  // signed-in user immediately.
  useEffect(() => {
    let cancelled = false;
    getRedirectResult(auth)
      .then((result) => {
        if (cancelled || !result?.user) return;
        setUser(result.user);
        createUserDocument(result.user).catch(() => {});
      })
      .catch((error) => {
        // auth/no-auth-event is benign — it just means no pending redirect.
        if (error?.code && error.code !== 'auth/no-auth-event') {
          console.error('Redirect sign-in error:', error);
        }
      });
    return () => {
      cancelled = true;
    };
    // createUserDocument is stable (useCallback with []), safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user spaces and orgs when user changes
  useEffect(() => {
    if (user) {
      fetchUserSpaces();
      // Load organization data
      getUserOrganizations(user.uid)
        .then((orgs) => {
          setUserOrganizations(orgs);
          if (orgs.length > 0) {
            getOrganizationMembers(orgs[0].id)
              .then(setActiveOrgMembers)
              .catch(() => setActiveOrgMembers([]));
          } else {
            setActiveOrgMembers([]);
          }
        })
        .catch((err) => {
          console.error('Failed to load organizations:', err);
          setUserOrganizations([]);
        });
      getPendingInvitesForUser(user.email)
        .then(setPendingInvites)
        .catch(() => setPendingInvites([]));
    } else {
      setUserSpaces({ owned: [], shared: [] });
      setUserOrganizations([]);
      setActiveOrgMembers([]);
      setPendingInvites([]);
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
          accountTier: 'free',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
        setAccountTier('free');
      } else {
        const data = userDoc.data();
        setAccountTier(data.accountTier || 'free');
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

  // Login handler — uses redirect (not popup) for forward compatibility with
  // browser storage partitioning, mobile browsers, and strict COOP/COEP.
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

      // Page will navigate to Google and return to /. The post-redirect
      // useEffect above picks up the result via getRedirectResult.
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Login error:', error);

      if (error.code === 'auth/invalid-api-key') {
        alert(
          'Firebase is not configured properly. Please contact the administrator.'
        );
        return;
      }

      alert('Login failed. Please try again.');
    }
  }, []);

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
    async (spaceId, ownerId = null, spaceType = 'diagram') => {
      if (!user) return;
      const effectiveOwner =
        ownerId && ownerId !== user.uid ? ownerId : user.uid;
      if (onOpenSpace) {
        onOpenSpace(spaceId, effectiveOwner, spaceType);
      }
    },
    [user, onOpenSpace]
  );

  // Fetch user spaces
  const fetchUserSpaces = useCallback(async () => {
    if (!user) return;

    try {
      // Get owned spaces
      const spacesSnapshot = await getDocs(
        collection(db, 'users', user.uid, 'spaces')
      );
      const ownedSpaces = spacesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
      }));

      // Get shared spaces from the user's sharedSpaces subcollection
      const sharedSpacesSnapshot = await getDocs(
        collection(db, 'users', user.uid, 'sharedSpaces')
      );
      const sharedSpaces = [];

      for (const sharedSpaceDoc of sharedSpacesSnapshot.docs) {
        const sharedData = sharedSpaceDoc.data();
        const { spaceId, ownerId } = sharedData;
        try {
          const spaceDoc = await getDoc(doc(db, 'users', ownerId, 'spaces', spaceId));
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
            // Stale reference — clean it up silently
            deleteDoc(doc(db, 'users', user.uid, 'sharedSpaces', spaceId)).catch(() => {});
          }
        } catch {
          // Skip inaccessible spaces
        }
      }

      setUserSpaces({ owned: ownedSpaces, shared: sharedSpaces });
    } catch (error) {
      console.error('Error fetching user spaces:', error);
    }
  }, [user]);

  // Create new space
  const createNewSpace = useCallback(
    async (spaceName, email, spaceType = 'diagram') => {
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
          type: spaceType,
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

  const handleAcceptInvite = useCallback(
    async (orgId) => {
      if (!user) return;
      try {
        await acceptInvite(orgId, user.uid, user.email);
        setPendingInvites((prev) => prev.filter((p) => p.org.id !== orgId));
        const orgs = await getUserOrganizations(user.uid);
        setUserOrganizations(orgs);
        if (orgs.length > 0) {
          getOrganizationMembers(orgs[0].id)
            .then(setActiveOrgMembers)
            .catch(() => setActiveOrgMembers([]));
        }
      } catch (err) {
        console.error('Failed to accept invite:', err);
      }
    },
    [user]
  );

  const handleDeclineInvite = useCallback(
    async (orgId) => {
      if (!user) return;
      try {
        await declineInvite(orgId, user.email);
        setPendingInvites((prev) => prev.filter((p) => p.org.id !== orgId));
      } catch (err) {
        console.error('Failed to decline invite:', err);
      }
    },
    [user]
  );

  // Derived state for login/spaces UI
  const spaceTableProps = useMemo(
    () => ({
      userSpaces,
      userOrgs: userOrganizations,
      windowSize,
      user,
      isDeleting,
      pendingInvites,
      onNavigateToSpace: navigateToSpace,
      onCreateSpace: () => {
        const limit = TIER_LIMITS[accountTier] || TIER_LIMITS.free;
        if (userSpaces.owned.length >= limit) {
          setShowUpgradePrompt(true);
        } else {
          setShowCreateSpacePopup(true);
        }
      },
      onShareSpace: (space) => {
        setSelectedSpaceForSharing(space);
        setShowSharePopup(true);
      },
      onDeleteSpace: handleDeleteSpace,
      onLeaveSpace: handleLeaveSpace,
      onAcceptInvite: handleAcceptInvite,
      onDeclineInvite: handleDeclineInvite,
      onCreateOrganization: () => setShowOrgManager(true),
      onManageOrganization: () => setShowOrgManager(true),
    }),
    [
      userSpaces,
      userOrganizations,
      windowSize,
      user,
      isDeleting,
      pendingInvites,
      navigateToSpace,
      handleDeleteSpace,
      handleLeaveSpace,
      handleAcceptInvite,
      handleDeclineInvite,
      accountTier,
    ]
  );

  // Props for the create space popup
  const createSpaceProps = useMemo(
    () => ({
      show: showCreateSpacePopup,
      initialSpaceName: newSpaceName,
      initialEmail: sharedEmail,
      isCreating: isCreatingSpace,
      organizationMembers: activeOrgMembers,
      currentUserId: user?.uid,
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
      activeOrgMembers,
      user?.uid,
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
      organizationMembers: activeOrgMembers,
      currentUserId: user?.uid,
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
      activeOrgMembers,
      user?.uid,
    ]
  );

  const isMobile = windowSize.width <= 768;

  const footerBtnStyle = {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#e6e6e6',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'background 120ms ease, border-color 120ms ease',
  };

  return (
    <div
      className="landing-view"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Modals */}
      <CreateSpacePopup {...createSpaceProps} />
      <UpgradePrompt
        show={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        currentTier={accountTier}
      />
      <ShareSpacePopup {...sharePopupProps} />
      <OrganizationManager
        user={user}
        show={showOrgManager}
        onClose={() => setShowOrgManager(false)}
      />

      {/* 3D scene rendered in shared Canvas via sceneStore */}

      {/* Logged-in UI */}
      {user && (
        <>
          <LandingTopBar
            user={user}
            onLogout={handleLogout}
            onOpenOrgManager={() => setShowOrgManager(true)}
            pendingInviteCount={pendingInvites.length}
          />
          <div
            style={{
              position: 'fixed',
              top: '64px',
              bottom: windowSize.width <= 768 ? '12px' : '56px',
              left: windowSize.width <= 768 ? '8px' : '270px',
              right: windowSize.width <= 768 ? '8px' : '270px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              opacity: 0.95,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(22, 22, 26, 0.92)',
              borderRadius: '10px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
              zIndex: 10,
              display: 'flex',
              padding: windowSize.width <= 480 ? '0.5rem' : '1rem',
              overflow: 'auto',
              pointerEvents: 'auto',
            }}
          >
            <SpacesTable {...spaceTableProps} />
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'fixed',
              bottom: '8px',
              height: '40px',
              left: windowSize.width <= 768 ? '8px' : '270px',
              right: windowSize.width <= 768 ? '8px' : '270px',
              background: 'linear-gradient(180deg, rgba(22, 22, 26, 0.92), rgba(14, 14, 18, 0.92))',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: windowSize.width <= 480 ? '8px' : '24px',
              padding: '0 16px',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              pointerEvents: 'auto',
            }}
          >
            <button
              style={footerBtnStyle}
              onClick={() => window.open('https://github.com/anomalyco/opencode/issues', '_blank')}
              title="Report a bug or suggest a feature"
            >
              Feedback
            </button>
            <button style={footerBtnStyle} title="View documentation (coming soon)">
              Docs
            </button>
            <button style={footerBtnStyle} title="Keyboard shortcuts (coming soon)">
              Shortcuts
            </button>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, userSelect: 'none' }}>
              v1.0.0
            </span>
          </div>
        </>
      )}

      {/* Pre-login UI */}
      {!user && (
        <>
          {/* Welcome overlay — fades out as user scrolls */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 15,
              opacity: Math.max(0, 1 - scrollProgress * 12),
              pointerEvents: scrollProgress > 0.08 ? 'none' : 'auto',
              transition: 'opacity 0.3s ease',
            }}
          >
            <WelcomeOverlay
              windowSize={windowSize}
              onLogin={handleLogin}
              onTryWithoutAccount={onTryWithoutAccount}
            />
            {/* Scroll hint */}
            <div
              style={{
                position: 'absolute',
                bottom: '28px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                zIndex: 50,
                animation: 'scrollBounce 2s ease-in-out infinite',
                cursor: 'pointer',
                opacity: 0.65,
                pointerEvents: 'auto',
              }}
              onClick={() => {
                rawScrollRef.current = Math.min(MAX_SCROLL, rawScrollRef.current + 500);
                scheduleScrollUpdate(rawScrollRef.current / MAX_SCROLL);
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: '#444',
                }}
              >
                Explore
              </span>
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L10 10L19 1" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Scroll-driven content sections */}
          <LandingScrollContent
            scrollProgress={scrollProgress}
            isMobile={isMobile}
            onLogin={handleLogin}
            onTryWithoutAccount={onTryWithoutAccount}
          />
        </>
      )}
    </div>
  );
}

export default React.memo(LandingApp);
