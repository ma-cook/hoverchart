import React, { useEffect, useState } from 'react';
import { getUserOrganizations } from '../../services/organizationService';
import { AdminUsersTable } from './AdminUsersTable';
import { AdminOrgUsersTable } from './AdminOrgUsersTable';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

// Admin sections, in display order. `requires` names the server-side role that
// unlocks the section, so the nav is derived from the user's scopes rather than
// hardcoded. Adding a section (spaces, updates, scan jobs, …) means adding one
// entry here plus its component — no changes to the shell.
const ADMIN_SECTIONS = [
  {
    id: 'users',
    label: 'All Users',
    title: 'All Users',
    subtitle: 'Every account on the platform.',
    requires: 'isAdmin',
  },
  {
    id: 'org-users',
    label: 'Org Users',
    title: 'Organization Users',
    subtitle: 'Members of the organizations you administer.',
    requires: 'isOrgAdmin',
  },
];

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: FONT_FAMILY,
  pointerEvents: 'auto',
};

const panelStyle = {
  display: 'flex',
  flexDirection: 'column',
  width: 'min(1040px, 94vw)',
  height: 'min(760px, 90vh)',
  background: '#fff',
  borderRadius: '10px',
  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.45)',
  overflow: 'hidden',
};

const navRailStyle = {
  width: '180px',
  flexShrink: 0,
  borderRight: '1px solid #e5e5e5',
  background: '#fafafa',
  padding: '12px 0',
};

const navItemBase = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '9px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: FONT_FAMILY,
  borderLeft: '2px solid transparent',
};

const navItemActive = {
  ...navItemBase,
  background: '#f0f0f0',
  borderLeft: '2px solid #111',
  fontWeight: '600',
};

function scopeLabel(isAdmin, isOrgAdmin) {
  if (isAdmin && isOrgAdmin) return 'Application admin · organization admin';
  if (isAdmin) return 'Application admin';
  if (isOrgAdmin) return 'Organization admin';
  return '';
}

/**
 * Admin dashboard.
 *
 * Renders only the sections the caller is entitled to:
 *   - "All Users"   requires application admin (platform-wide)
 *   - "Org Users"   requires organization admin (their orgs only)
 *
 * Both gates are enforced server-side; hiding a section here is a convenience,
 * never the control.
 */
export const AdminDashboard = React.memo(
  ({ show, onClose, isAdmin, isOrgAdmin, currentUserId }) => {
    const [activeSection, setActiveSection] = useState('users');
    const [orgs, setOrgs] = useState([]);
    const [orgId, setOrgId] = useState('');

    // Cheap enough to derive inline; `scopes` is a fresh object each render so
    // it must not be a useMemo dependency.
    const scopes = { isAdmin, isOrgAdmin };
    const sections = ADMIN_SECTIONS.filter((section) => scopes[section.requires]);

    // Fall back to the first visible section so a stale id from a previous open
    // can't leave the panel blank (e.g. app admin who also stopped being an
    // org admin).
    useEffect(() => {
      if (!sections.some((section) => section.id === activeSection)) {
        setActiveSection(sections[0]?.id || 'users');
      }
    }, [sections, activeSection]);

    // Org admin: keep only the organizations they actually administer so the
    // directory picker can't offer one the server would reject.
    // `GET /api/organizations` returns the caller's own `role` and `is_owner`.
    useEffect(() => {
      if (!show || !isOrgAdmin) return undefined;
      let cancelled = false;
      (async () => {
        try {
          const fetched = await getUserOrganizations();
          if (cancelled) return;
          const administered = (fetched || []).filter(
            (org) => org.is_owner === true || org.role === 'admin'
          );
          setOrgs(administered);
          setOrgId((prev) =>
            administered.some((org) => org.id === prev) ? prev : administered[0]?.id || ''
          );
        } catch {
          if (!cancelled) setOrgs([]);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [show, isOrgAdmin]);

    // Escape closes.
    useEffect(() => {
      if (!show) return undefined;
      const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [show, onClose]);

    if (!show) return null;

    const section = sections.find((item) => item.id === activeSection);

    return (
      <div style={overlayStyle} onClick={onClose} role="presentation">
        <div
          style={panelStyle}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Admin dashboard"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #e5e5e5',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111' }}>
                Admin Dashboard
              </div>
              <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                {scopeLabel(isAdmin, isOrgAdmin)}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close admin dashboard"
              title="Close"
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                lineHeight: 1,
                cursor: 'pointer',
                color: '#666',
                padding: '4px 8px',
                borderRadius: '4px',
                fontFamily: FONT_FAMILY,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <nav style={navRailStyle} aria-label="Admin sections">
              {sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={item.id === activeSection ? navItemActive : navItemBase}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>
                  {section?.title}
                </div>
                {section?.subtitle && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    {section.subtitle}
                  </div>
                )}
              </div>

              <div
                style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '12px 20px 20px' }}
              >
                {sections.length === 0 && (
                  <div style={{ color: '#999', fontSize: '13px', padding: '24px 0' }}>
                    You don&apos;t administer any organization.
                  </div>
                )}

                {activeSection === 'users' && isAdmin && (
                  <AdminUsersTable currentUserId={currentUserId} />
                )}

                {activeSection === 'org-users' && isOrgAdmin && (
                  <AdminOrgUsersTable orgs={orgs} orgId={orgId} onOrgChange={setOrgId} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);