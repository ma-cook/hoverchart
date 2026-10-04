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

// Zero-width and formatting characters are invisible in virtually every font,
// yet `String.prototype.trim()` does not remove them -- of this set only U+FEFF
// counts as whitespace under the ES spec. A pasted or hand-edited allowlist is
// the realistic source, and a single one character breaks every comparison
// silently: no error, no warning, just an admin who can never get in.
const INVISIBLE_CHARS = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

const normalizeEmail = (value) =>
  String(value ?? '')
    .replace(INVISIBLE_CHARS, '')
    .trim()
    .toLowerCase();

const getAdminEmails = () =>
  String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);

export const isAppAdminEmail = (email) => {
  if (!email) return false;
  return getAdminEmails().includes(normalizeEmail(email));
};

// Boot-time summary of the allowlist, for `index.js` to report.
//
// Deliberately reports per-entry *lengths* instead of the addresses. A
// truncated or mistyped address is by far the most likely misconfiguration, and
// a length that disagrees with the operator's expectation is enough to catch it
// without writing admin email addresses into log storage.
export const getAdminEmailDiagnostics = () => {
  const raw = String(process.env.ADMIN_EMAILS ?? '');
  const entries = getAdminEmails();
  return {
    configured: raw.trim().length > 0,
    count: entries.length,
    entryLengths: entries.map((entry) => entry.length),
    // Outside printable ASCII means invisible or ambiguous characters crept in
    // from a copy/paste (smart quotes, zero-width joiners, non-breaking space).
    hasNonPrintableAscii: /[^\x20-\x7E]/.test(raw),
  };
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