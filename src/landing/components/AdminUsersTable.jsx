import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ADMIN_TIERS,
  DEFAULT_PAGE_SIZE,
  fetchAdminUsers,
  updateUserTier,
  deleteUser,
} from '../../services/adminService';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

const SEARCH_DEBOUNCE_MS = 250;

const toolbarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '12px',
  flexWrap: 'wrap',
};

const inputStyle = {
  padding: '7px 10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '13px',
  fontFamily: FONT_FAMILY,
  minWidth: '240px',
  outline: 'none',
};

const selectStyle = {
  padding: '5px 6px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '12px',
  fontFamily: FONT_FAMILY,
  background: '#fff',
  cursor: 'pointer',
};

const smallBtn = {
  padding: '4px 10px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: FONT_FAMILY,
  border: '1px solid #ddd',
  background: '#fff',
  color: '#333',
};

const dangerBtn = {
  ...smallBtn,
  color: '#e53e3e',
  border: '1px solid #e53e3e',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '12px',
};

const thStyle = {
  textAlign: 'left',
  padding: '7px 8px',
  borderBottom: '1px solid #ddd',
  color: '#777',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '7px 8px',
  borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'middle',
};

const emptyStyle = {
  textAlign: 'center',
  color: '#999',
  padding: '28px 0',
  fontSize: '13px',
};

const bannerBase = {
  padding: '7px 10px',
  borderRadius: '4px',
  fontSize: '12px',
  marginBottom: '10px',
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

function Avatar({ url, name }) {
  const [errored, setErrored] = useState(false);
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#4a90d9',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 600,
        overflow: 'hidden',
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >
      {url && !errored ? (
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </span>
  );
}

/**
 * Platform-wide user directory. Application admins only — the server rejects
 * everyone else on /api/admin/users regardless of what the client renders.
 *
 * Supports server-side search by email/display name, paging, tier editing and
 * account deletion.
 */
export const AdminUsersTable = React.memo(({ currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const debounceRef = useRef(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminUsers({ search, page, limit: DEFAULT_PAGE_SIZE });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err?.message || 'Failed to load users.');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

  const handleTierChange = async (user, tier) => {
    const previous = user.tier;
    if (tier === previous) return;
    setBusyId(user.id);
    setError('');
    setNotice('');
    // Optimistic; rolled back below if the request fails.
    setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, tier } : row)));
    try {
      await updateUserTier(user.id, tier);
      setNotice(`Set ${user.email || user.id} to ${tier}.`);
    } catch (err) {
      setUsers((prev) =>
        prev.map((row) => (row.id === user.id ? { ...row, tier: previous } : row))
      );
      setError(err?.message || 'Failed to update tier.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    setBusyId(user.id);
    setError('');
    setNotice('');
    try {
      await deleteUser(user.id);
      setConfirmDeleteId(null);
      setNotice(`Deleted ${user.email || user.id}.`);
      // Step back a page if the last row on this page just went away.
      const remaining = users.length - 1;
      if (remaining === 0 && page > 1) setPage((prev) => prev - 1);
      else load();
    } catch (err) {
      setConfirmDeleteId(null);
      setError(err?.message || 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={toolbarStyle}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by email or name…"
          aria-label="Search users"
          style={inputStyle}
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            style={smallBtn}
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
          {loading ? 'Loading…' : `${total} user${total === 1 ? '' : 's'}`}
        </span>
      </div>

      {error && (
        <div
          style={{
            ...bannerBase,
            background: '#fff5f5',
            border: '1px solid #e53e3e',
            color: '#c53030',
          }}
        >
          {error}
        </div>
      )}
      {notice && !error && (
        <div
          style={{
            ...bannerBase,
            background: '#f0fff4',
            border: '1px solid #48bb78',
            color: '#22543d',
          }}
        >
          {notice}
        </div>
      )}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Tier</th>
            <th style={thStyle}>Spaces</th>
            <th style={thStyle}>Joined</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading &&
            users.length === 0 && (
              <tr>
                <td colSpan={6} style={emptyStyle}>
                  {search ? `No users match “${search}”.` : 'No users yet.'}
                </td>
              </tr>
            )}

          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;
            const confirming = confirmDeleteId === user.id;

            return (
              <tr key={user.id} style={{ opacity: busy ? 0.6 : 1 }}>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Avatar url={user.photo_url} name={user.display_name || user.email} />
                    <span style={{ fontWeight: '500' }}>
                      {user.display_name || '—'}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: '10px', color: '#888' }}>(you)</span>
                    )}
                  </span>
                </td>
                <td
                  style={{
                    ...tdStyle,
                    maxWidth: '220px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={user.email || ''}
                >
                  {user.email || '—'}
                </td>
                <td style={tdStyle}>
                  <select
                    value={user.tier || 'free'}
                    disabled={busy}
                    onChange={(e) => handleTierChange(user, e.target.value)}
                    aria-label={`Tier for ${user.email || user.id}`}
                    style={selectStyle}
                  >
                    {ADMIN_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>{user.space_count ?? 0}</td>
                <td style={tdStyle}>{formatDate(user.created_at)}</td>
                <td style={tdStyle}>
                  {isSelf ? (
                    <span style={{ fontSize: '11px', color: '#aaa' }}>—</span>
                  ) : confirming ? (
                    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#c53030' }}>Delete account?</span>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={busy}
                        style={{ ...dangerBtn, background: '#fff5f5' }}
                      >
                        {busy ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={busy}
                        style={smallBtn}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      disabled={busy}
                      style={dangerBtn}
                      title={`Delete ${user.email || user.id} and everything they own`}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          fontSize: '12px',
          color: '#888',
        }}
      >
        <button
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1 || loading}
          style={{ ...smallBtn, opacity: page <= 1 || loading ? 0.5 : 1 }}
        >
          ‹ Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages || loading}
          style={{ ...smallBtn, opacity: page >= totalPages || loading ? 0.5 : 1 }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
});