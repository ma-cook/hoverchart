import { api } from '../api-client';

export const PLAN_LIMITS = {
  free: 3,
  team: 10,
  business: 50,
};

export const createOrganization = async (orgName, _plan = 'free') => {
  const response = await api.post('/api/organizations', { name: orgName });
  return response.data || response;
};

export const getUserOrganizations = async () => {
  try {
    const response = await api.get('/api/organizations');
    return response.data || response || [];
  } catch {
    return [];
  }
};

export const getOrganizationById = async (orgId) => {
  try {
    const response = await api.get(`/api/organizations/${orgId}`);
    return response.data || response || null;
  } catch {
    return null;
  }
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

export const inviteUserToOrganization = async (orgId, adminUserId, email) => {
  const response = await api.post(`/api/organizations/${orgId}/invites`, { email });
  return response.data || response;
};

export const getPendingInvitesForUser = async (userEmail) => {
  try {
    const response = await api.get('/api/organizations');
    const orgs = response.data || response || [];
    const results = [];

    for (const org of orgs) {
      const pendingInvites = (org.invites || []).filter(
        (i) => i.email.toLowerCase() === userEmail.toLowerCase() && i.status === 'pending'
      );
      for (const invite of pendingInvites) {
        results.push({ org, invite });
      }
    }

    return results;
  } catch (err) {
    console.error('Failed to fetch pending invites:', err);
    return [];
  }
};

export const acceptInvite = async (orgId, userId) => {
  const response = await api.post(`/api/organizations/${orgId}/members`, { user_id: userId, role: 'member' });
  return response.data || response;
};

export const declineInvite = async (_orgId) => {
  console.warn('declineInvite is not supported in the new API');
};

export const removeMemberFromOrganization = async (orgId, adminUserId, targetUserId) => {
  await api.delete(`/api/organizations/${orgId}/members/${targetUserId}`);
};

export const leaveOrganization = async (orgId, userId) => {
  await api.delete(`/api/organizations/${orgId}/members/${userId}`);
};

export const updateOrganizationPlan = async (orgId, adminUserId, newPlan) => {
  const isAdmin = await isOrganizationAdmin(orgId, adminUserId);
  if (!isAdmin) throw new Error('Only admins can update the plan');

  const newLimit = PLAN_LIMITS[newPlan];
  if (!newLimit) throw new Error('Invalid plan');

  console.warn('updateOrganizationPlan is not supported in the new API');
};

export const deleteOrganization = async (_orgId) => {
  console.warn('deleteOrganization is not supported in the new API');
};
