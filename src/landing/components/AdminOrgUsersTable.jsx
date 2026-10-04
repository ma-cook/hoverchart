import React, { useCallback, useEffect, useState } from 'react';
import { fetchOrgUsers, updateOrgMemberRole } from '../../services/adminService';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

const selectStyle = {
  padding: '7px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '13px',
  fontFamily: FONT_FAMILY,
  background: '#fff',
  cursor: 'pointer',
  minWidth: '240px',
};

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '12px' };
const thStyle = {
  textAlign: 'left',
  padding: '7px 8px',
  borderBottom: '1px solid #ddd',
  color: '#777',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};
const tdStyle = { padding: '7px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const emptyStyle = { textAlign: 'center', color: '#999', padding: '28px 0', fontSize: '13px' };

const memberRoleSelect = {
  padding: '4px 6px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: FONT_FAMILY,
  background: '#fff',
  cursor: 'pointer',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Organization-scoped user directory.
 *
 * This is the organization admin's counterpart to AdminUsersTable: it shows only
 * the members of ONE organization, and only that organization's admins can load
 * it (GET /api/organizations/:id/users). There is deliberately no tier editing
 * or account deletion here — those are platform-wide operations, so a user who
 * also holds application admin should use "All Users" instead.
 *
 * Role changes are allowed because that is exactly the operation an org admin
 * is supposed to control.
 */
export const AdminOrgUsersTable = React.memo(({ orgs, orgId, onOrgChange }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const activeOrg = (orgs || []).find((org) => org.id === orgId);
  const hasOptions = (orgs || []).length > 0;

  const load = useCallback(async () => {
    if (!orgId) {
      setMembers([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setMembers(await fetchOrgUsers(orgId));
    } catch (err) {
      setError(err?.message || 'Failed to load organization members.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleChange = async (member, role) => {
    const previous = member.role;
    if (role === previous || !orgId) return;
    setBusyId(member.id);
    setError('');
    setMembers((prev) => prev.map((row) => (row.id === member.id ? { ...row, role } : row)));
    try {
      await updateOrgMemberRole(orgId, member.id, role);
    } catch (err) {
      setMembers((prev) =>
        prev.map((row) => (row.id === member.id ? { ...row, role: previous } : row))
      );
      setError(err?.message || 'Failed to update role.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {hasOptions && (
        <div style={{ marginBottom: '12px' }}>
          <select
            value={orgId}
            onChange={(e) => onOrgChange?.(e.target.value)}
            aria-label="Organization"
            style={selectStyle}
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
                {org.is_owner ? ' (owner)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '7px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            marginBottom: '10px',
            background: '#fff5f5',
            border: '1px solid #e53e3e',
            color: '#c53030',
          }}
        >
          {error}
        </div>
      )}

      {!hasOptions && (
        <div style={emptyStyle}>You don&apos;t administer any organization.</div>
      )}

      {hasOptions && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {!loading && members.length === 0 && (
              <tr>
                <td colSpan={5} style={emptyStyle}>
                  No members found.
                </td>
              </tr>
            )}

            {members.map((member) => {
              const busy = busyId === member.id;
              return (
                <tr key={member.id} style={{ opacity: busy ? 0.6 : 1 }}>
                  <td style={tdStyle}>{member.display_name || '—'}</td>
                  <td style={tdStyle}>{member.email || '—'}</td>
                  <td style={tdStyle}>{member.tier || 'free'}</td>
                  <td style={tdStyle}>
                    {member.is_owner ? (
                      // The owner's role is fixed and can't be changed through
                      // the API, so render it as text rather than a dead select.
                      <span style={{ fontSize: '11px', color: '#553c9a', fontWeight: '600' }}>
                        admin (owner)
                      </span>
                    ) : (
                      <select
                        value={member.role || 'member'}
                        disabled={busy}
                        onChange={(e) => handleRoleChange(member, e.target.value)}
                        aria-label={`Role for ${member.email || member.id}`}
                        style={memberRoleSelect}
                      >
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td style={tdStyle}>{formatDate(member.joined_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {activeOrg && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#aaa' }}>
          {loading
            ? 'Loading members…'
            : `${members.length} member${members.length === 1 ? '' : 's'} in ${activeOrg.name}.`}
        </div>
      )}
    </div>
  );
});