// Application-level admin authorization.
//
// Admins are configured with the ADMIN_EMAILS environment variable
// (comma-separated). This is deliberately an env allowlist rather than an
// `users.is_admin` column: admin status is a deployment concern, so changing
// it must not need a migration, and it must not be readable or writable
// through any API.
//
// IMPORTANT: application admin and organization admin are two DIFFERENT
// things and are intentionally not interchangeable.
//   - Application admin (this file): sees every user, may edit tiers and
//     delete users. Configured by the operator via ADMIN_EMAILS.
//   - Organization admin (`org_members.role = 'admin'`, see auth/orgAdmin.js):
//     may only manage members of the organizations they administer. A user
//     may be an org admin without being an application admin, and holding
//     application admin does not implicitly grant admin over any org.
//   - Organization `owner_id` counts as an org admin.

const getAdminEmails = () =>
  String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAppAdminEmail = (email) => {
  if (!email) return false;
  return getAdminEmails().includes(String(email).trim().toLowerCase());
};

export const isAppAdmin = (user) => isAppAdminEmail(user?.email);

// Guard for routes that require application-level admin. Must be mounted after
// `authenticate`.
//
// Rejects with 403 rather than 401 so the client's automatic token-refresh
// retry (see src/api-client.js) doesn't fire a pointless refresh and then
// bounce the user to a login screen.
export function requireAdmin(req, res, next) {
  // `authenticate` populates req.user for real accounts and req.guest for guest
  // tokens. Guests are authenticated but are never admins.
  if (req.guest || !req.user || !isAppAdmin(req.user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.isAppAdmin = true;
  next();
}