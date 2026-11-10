import { api } from '../api-client';

export const PLAN_LIMITS = {
  free: 3,
  team: 10,
  business: 50,
};

export const createOrganization = async (orgName, plan = 'free') => {
  const response = await api.post('/api/organizations', { name: orgName, plan });
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

export const inviteUserToOrganization = async (orgId, email) => {
  const response = await api.post(`/api/organizations/${orgId}/invites`, { email });
  return response.data || response;
};

export const getPendingInvitesForUser = async () => {
  try {
    const response = await api.get('/api/organizations/pending-invites');
    return response.data || response || [];
  } catch (err) {
    console.error('Failed to fetch pending invites:', err);
    return [];
  }
};

export const acceptInvite = async (orgId, userId) => {
  const response = await api.post(`/api/organizations/${orgId}/members`, { user_id: userId, role: 'member' });
  return response.data || response;
};

export const declineInvite = async (orgId) => {
  const response = await api.delete(`/api/organizations/${orgId}/invites`);
  return response.data || response;
};

export const removeMemberFromOrganization = async (orgId, targetUserId) => {
  await api.delete(`/api/organizations/${orgId}/members/${targetUserId}`);
};

export const leaveOrganization = async (orgId, userId) => {
  await api.delete(`/api/organizations/${orgId}/members/${userId}`);
};

export const updateOrganizationPlan = async (orgId, newPlan) => {
  const response = await api.patch(`/api/organizations/${orgId}`, { plan: newPlan });
  return response.data || response;
};

export const deleteOrganization = async (orgId) => {
  const response = await api.delete(`/api/organizations/${orgId}`);
  return response.data || response;
};
