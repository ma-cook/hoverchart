import { api } from '../api-client';

// Client for the two admin surfaces. They are deliberately separate APIs owned
// by different server-side roles, so they are kept as separate functions here
// rather than one `isAdmin`-flagged helper:
//
//   Application admin (platform-wide, configured server-side via ADMIN_EMAILS)
//     - fetchAdminUsers / updateUserTier / deleteUser  ->  /api/admin/users
//   Organization admin (admin of one or more orgs, via org_members.role)
//     - fetchOrgUsers                                  ->  /api/organizations/:id/users
//
// Whether the current user may call these at all is decided by the server; this
// module never caches or re-implements the authorization decision.

// Mirrors the account tiers the server accepts. Keep in sync with VALID_TIERS in
// backend/src/api/admin.js and TIER_LIMITS in backend/src/api/scanJobs.js.
export const ADMIN_TIERS = ['free', 'pro'];

export const DEFAULT_PAGE_SIZE = 50;

// Platform-wide user list (application admins only).
// Returns { users, total, page, limit }; throws on failure so the caller can
// distinguish "empty" from "failed to load".
export const fetchAdminUsers = async ({ search = '', page = 1, limit = DEFAULT_PAGE_SIZE } = {}) => {
  const params = { page, limit };
  const term = search.trim();
  if (term) params.search = term;
  const data = await api.get('/api/admin/users', { params });
  return {
    users: data?.users || [],
    total: typeof data?.total === 'number' ? data.total : 0,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
  };
};

// Application admins only. Tier is one of ADMIN_TIERS.
export const updateUserTier = async (userId, tier) => {
  const data = await api.patch(`/api/admin/users/${encodeURIComponent(userId)}/tier`, { tier });
  return data;
};

// Application admins only. Removes the user and everything they own.
export const deleteUser = async (userId) => {
  const data = await api.delete(`/api/admin/users/${encodeURIComponent(userId)}`);
  return data;
};

// Organization-scoped user directory (organization admins only).
// Read-only: the org admin sees exactly the members of this org and nothing
// platform-wide.
export const fetchOrgUsers = async (orgId) => {
  try {
    const data = await api.get(`/api/organizations/${encodeURIComponent(orgId)}/users`);
    return data?.members || [];
  } catch {
    return [];
  }
};

// Organization admins only. Change a member's role within this org.
export const updateOrgMemberRole = async (orgId, userId, role) => {
  const data = await api.patch(
    `/api/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
    { role }
  );
  return data;
};