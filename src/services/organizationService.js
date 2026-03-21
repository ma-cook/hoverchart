import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

export const PLAN_LIMITS = {
  free: 3,
  team: 10,
  business: 50,
};

export const createOrganization = async (userId, orgName, plan = 'free') => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) throw new Error('User not found');

  const userData = userDoc.data();
  const memberLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const orgRef = doc(collection(db, 'organizations'));
  const now = new Date().toISOString();

  const orgData = {
    name: orgName,
    createdAt: now,
    createdBy: userId,
    ownerId: userId,
    plan,
    memberLimit,
    members: [
      {
        userId,
        email: userData.email || '',
        displayName: userData.displayName || userData.email || '',
        role: 'admin',
        joinedAt: now,
      },
    ],
    memberIds: [userId],
    invites: [],
    invitedEmails: [],
  };

  await setDoc(orgRef, orgData);
  await updateDoc(userRef, { organizations: arrayUnion(orgRef.id) });

  return { id: orgRef.id, ...orgData };
};

export const getUserOrganizations = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return [];

  const orgIds = userDoc.data().organizations || [];
  if (orgIds.length === 0) return [];

  const orgs = await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', orgId));
        if (!orgDoc.exists()) return null;
        return { id: orgDoc.id, ...orgDoc.data() };
      } catch (err) {
        console.warn(`Failed to fetch organization ${orgId}:`, err.message);
        return null;
      }
    })
  );

  return orgs.filter(Boolean);
};

export const getOrganizationById = async (orgId) => {
  const orgDoc = await getDoc(doc(db, 'organizations', orgId));
  if (!orgDoc.exists()) return null;
  return { id: orgDoc.id, ...orgDoc.data() };
};

export const getOrganizationMembers = async (orgId) => {
  const org = await getOrganizationById(orgId);
  if (!org) return [];
  return org.members || [];
};

export const getMemberCount = async (orgId) => {
  const org = await getOrganizationById(orgId);
  if (!org) return 0;
  return (org.members || []).length;
};

export const isOrganizationAdmin = async (orgId, userId) => {
  const org = await getOrganizationById(orgId);
  if (!org) return false;
  return (org.members || []).some(
    (m) => m.userId === userId && m.role === 'admin'
  );
};

export const inviteUserToOrganization = async (
  orgId,
  adminUserId,
  email
) => {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const isAdmin = (org.members || []).some(
    (m) => m.userId === adminUserId && m.role === 'admin'
  );
  if (!isAdmin)
    throw new Error('Only organization admins can invite members');

  const currentCount = (org.members || []).length;
  const pendingCount = (org.invites || []).filter(
    (i) => i.status === 'pending'
  ).length;

  if (currentCount + pendingCount >= org.memberLimit) {
    throw new Error(
      `Organization member limit (${org.memberLimit}) reached. Upgrade your plan to add more members.`
    );
  }

  const alreadyMember = (org.members || []).some(
    (m) => m.email.toLowerCase() === email.toLowerCase()
  );
  if (alreadyMember) throw new Error('User is already a member');

  const alreadyInvited = (org.invites || []).some(
    (i) =>
      i.email.toLowerCase() === email.toLowerCase() &&
      i.status === 'pending'
  );
  if (alreadyInvited)
    throw new Error('An invite has already been sent to this email');

  const invite = {
    email,
    invitedBy: adminUserId,
    invitedAt: new Date().toISOString(),
    status: 'pending',
  };

  await updateDoc(doc(db, 'organizations', orgId), {
    invites: arrayUnion(invite),
    invitedEmails: arrayUnion(email.toLowerCase()),
  });

  // Write a separate invite doc the invited user can query
  const inviteDocRef = doc(collection(db, 'orgInvites'));
  await setDoc(inviteDocRef, {
    email: email,
    orgId,
    orgName: org.name,
    invitedBy: adminUserId,
    invitedAt: invite.invitedAt,
    status: 'pending',
  });

  return invite;
};

export const getPendingInvitesForUser = async (userEmail) => {
  try {
    const invitesQuery = query(
      collection(db, 'orgInvites'),
      where('email', '==', userEmail),
      where('status', '==', 'pending')
    );
    const invitesSnapshot = await getDocs(invitesQuery);
    const results = [];

    for (const inviteDoc of invitesSnapshot.docs) {
      const inviteData = inviteDoc.data();
      try {
        const org = await getOrganizationById(inviteData.orgId);
        if (org) {
          results.push({
            org,
            invite: { ...inviteData, id: inviteDoc.id },
          });
        }
      } catch {
        // Org may have been deleted or user lacks read access — skip
      }
    }

    return results;
  } catch (err) {
    console.error('Failed to fetch pending invites:', err);
    return [];
  }
};

export const acceptInvite = async (orgId, userId, userEmail) => {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const currentCount = (org.members || []).length;
  const pendingCount = (org.invites || []).filter(
    (i) =>
      i.status === 'pending' &&
      i.email.toLowerCase() !== userEmail.toLowerCase()
  ).length;

  if (currentCount + pendingCount >= org.memberLimit) {
    throw new Error(
      'This organization has reached its member limit. Please contact the organization admin.'
    );
  }

  const invite = (org.invites || []).find(
    (i) =>
      i.email.toLowerCase() === userEmail.toLowerCase() &&
      i.status === 'pending'
  );
  if (!invite) throw new Error('Invite not found or already processed');

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.exists() ? userDoc.data() : {};

  const updatedInvites = (org.invites || []).map((i) =>
    i.email.toLowerCase() === userEmail.toLowerCase() &&
    i.status === 'pending'
      ? { ...i, status: 'accepted' }
      : i
  );

  const newMember = {
    userId,
    email: userEmail,
    displayName: userData.displayName || userEmail,
    role: 'member',
    joinedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, 'organizations', orgId), {
    invites: updatedInvites,
    members: arrayUnion(newMember),
    memberIds: arrayUnion(userId),
    invitedEmails: arrayRemove(userEmail.toLowerCase()),
  });

  // Clean up the orgInvites doc
  try {
    const invitesQuery = query(
      collection(db, 'orgInvites'),
      where('email', '==', userEmail),
      where('orgId', '==', orgId),
      where('status', '==', 'pending')
    );
    const invitesSnapshot = await getDocs(invitesQuery);
    for (const inviteDoc of invitesSnapshot.docs) {
      await updateDoc(inviteDoc.ref, { status: 'accepted' });
    }
  } catch {
    // Non-critical — invite doc cleanup failed
  }

  await updateDoc(userRef, { organizations: arrayUnion(orgId) });
};

export const declineInvite = async (orgId, userEmail) => {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const updatedInvites = (org.invites || []).map((i) =>
    i.email.toLowerCase() === userEmail.toLowerCase() &&
    i.status === 'pending'
      ? { ...i, status: 'declined' }
      : i
  );

  await updateDoc(doc(db, 'organizations', orgId), {
    invites: updatedInvites,
    invitedEmails: arrayRemove(userEmail.toLowerCase()),
  });

  // Clean up the orgInvites doc
  try {
    const invitesQuery = query(
      collection(db, 'orgInvites'),
      where('email', '==', userEmail),
      where('orgId', '==', orgId),
      where('status', '==', 'pending')
    );
    const invitesSnapshot = await getDocs(invitesQuery);
    for (const inviteDoc of invitesSnapshot.docs) {
      await updateDoc(inviteDoc.ref, { status: 'declined' });
    }
  } catch {
    // Non-critical — invite doc cleanup failed
  }
};

export const removeMemberFromOrganization = async (
  orgId,
  adminUserId,
  targetUserId
) => {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const isAdmin = (org.members || []).some(
    (m) => m.userId === adminUserId && m.role === 'admin'
  );
  if (!isAdmin) throw new Error('Only admins can remove members');

  if (adminUserId === targetUserId)
    throw new Error('Use leaveOrganization to remove yourself');

  const adminCount = (org.members || []).filter(
    (m) => m.role === 'admin'
  ).length;
  const targetIsAdmin = (org.members || []).some(
    (m) => m.userId === targetUserId && m.role === 'admin'
  );
  if (targetIsAdmin && adminCount <= 1)
    throw new Error('Cannot remove the last admin');

  const memberToRemove = (org.members || []).find(
    (m) => m.userId === targetUserId
  );
  if (!memberToRemove) throw new Error('Member not found');

  const updatedMembers = (org.members || []).filter(
    (m) => m.userId !== targetUserId
  );

  await updateDoc(doc(db, 'organizations', orgId), {
    members: updatedMembers,
    memberIds: arrayRemove(targetUserId),
  });

  await updateDoc(doc(db, 'users', targetUserId), {
    organizations: arrayRemove(orgId),
  });
};

export const leaveOrganization = async (orgId, userId) => {
  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  const member = (org.members || []).find((m) => m.userId === userId);
  if (!member) throw new Error('You are not a member of this organization');

  if (member.role === 'admin') {
    const adminCount = (org.members || []).filter(
      (m) => m.role === 'admin'
    ).length;
    if (adminCount <= 1)
      throw new Error(
        'Cannot leave as the only admin. Transfer admin role or delete the organization first.'
      );
  }

  const updatedMembers = (org.members || []).filter(
    (m) => m.userId !== userId
  );

  await updateDoc(doc(db, 'organizations', orgId), {
    members: updatedMembers,
    memberIds: arrayRemove(userId),
  });

  await updateDoc(doc(db, 'users', userId), {
    organizations: arrayRemove(orgId),
  });
};

export const updateOrganizationPlan = async (orgId, adminUserId, newPlan) => {
  const isAdmin = await isOrganizationAdmin(orgId, adminUserId);
  if (!isAdmin) throw new Error('Only admins can update the plan');

  const newLimit = PLAN_LIMITS[newPlan];
  if (!newLimit) throw new Error('Invalid plan');

  await updateDoc(doc(db, 'organizations', orgId), {
    plan: newPlan,
    memberLimit: newLimit,
  });
};

export const deleteOrganization = async (orgId, adminUserId) => {
  const isAdmin = await isOrganizationAdmin(orgId, adminUserId);
  if (!isAdmin) throw new Error('Only admins can delete the organization');

  const org = await getOrganizationById(orgId);
  if (!org) throw new Error('Organization not found');

  await Promise.all(
    (org.members || []).map((m) =>
      updateDoc(doc(db, 'users', m.userId), {
        organizations: arrayRemove(orgId),
      })
    )
  );

  await deleteDoc(doc(db, 'organizations', orgId));
};
