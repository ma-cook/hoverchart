import React, { useState, useCallback, useMemo } from 'react';

// ---------- Static style constants (hoisted outside component) ----------
const TABLE_STYLES = {
  width: '100%',
  backgroundColor: 'white',
  borderCollapse: 'collapse',
  borderRadius: '4px',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
};
const LINK_STYLES = { color: '#0066cc', textDecoration: 'none' };
const BTN_STYLES = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  width: '28px',
  height: '28px',
  borderRadius: '4px',
  backgroundColor: '#f8f8f8',
  border: '1px solid #ddd',
  fontSize: '16px',
  color: '#333',
};
const SHARE_BTN_STYLES = { ...BTN_STYLES, marginLeft: '10px' };
const TRASH_BTN_STYLES = { ...BTN_STYLES, marginLeft: '5px' };
const LEAVE_BTN_STYLES = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  width: '26px',
  height: '26px',
  borderRadius: '4px',
  marginLeft: '5px',
  backgroundColor: 'rgba(255,235,235,0.7)',
  border: '1px solid rgba(220,53,69,0.3)',
  color: '#dc3545',
  transition: 'all 0.2s',
};
const INVITE_BANNER_BASE = {
  marginTop: '12px',
  backgroundColor: '#f0f7ff',
  border: '1px solid #c2dcf5',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: '10px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
};
const INVITE_TEXT_STYLES = { fontSize: '14px', color: '#333', fontWeight: '400' };
const INVITE_BTN_ROW = { display: 'flex', gap: '8px' };
const ACCEPT_BTN_STYLES = {
  padding: '6px 14px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500',
  fontFamily: 'inherit',
  transition: 'background-color 0.2s',
};
const NO_SPACES_TEXT = { textAlign: 'center' };
// -----------------------------------------------------------------------

export const SpacesTable = React.memo(
  ({
    userSpaces,
    windowSize,
    user,
    isDeleting,
    pendingInvites,
    onNavigateToSpace,
    onCreateSpace,
    onShareSpace,
    onDeleteSpace,
    onLeaveSpace,
    onAcceptInvite,
    onDeclineInvite,
  }) => {
    const [navigatingSpaceId, setNavigatingSpaceId] = useState(null);

    const handleSpaceClick = useCallback(
      async (e, spaceId, ownerId, spaceType) => {
        e.preventDefault();
        if (navigatingSpaceId) return;
        setNavigatingSpaceId(spaceId);
        try {
          await onNavigateToSpace(spaceId, ownerId, spaceType);
        } finally {
          setNavigatingSpaceId(null);
        }
      },
      [navigatingSpaceId, onNavigateToSpace]
    );

    // Only window-size-dependent styles computed here
    const isSmall = windowSize.width <= 480;
    const thStyles = useMemo(
      () => ({
        backgroundColor: '#f8f8f8',
        padding: isSmall ? '8px' : '12px',
        textAlign: 'left',
        fontWeight: '500',
        borderBottom: '1px solid #ddd',
        color: '#333',
        fontSize: isSmall ? '12px' : '14px',
      }),
      [isSmall]
    );
    const tdStyles = useMemo(
      () => ({
        padding: isSmall ? '8px' : '12px',
        borderBottom: '1px solid #eee',
        fontSize: isSmall ? '12px' : '14px',
        color: '#333',
        fontWeight: '400',
      }),
      [isSmall]
    );
    const categoryRowStyles = useMemo(
      () => ({
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        fontSize: isSmall ? '13px' : '15px',
      }),
      [isSmall]
    );
    const inviteBannerStyle = useMemo(
      () => ({ ...INVITE_BANNER_BASE, padding: isSmall ? '12px' : '14px 16px' }),
      [isSmall]
    );

    const hasOwnedSpaces = userSpaces.owned.length > 0;
    const hasSharedSpaces = userSpaces.shared.length > 0;

    return (
      <div
        style={{
          width: '100%',
          overflow: 'auto',
          padding: isSmall ? '5px' : '10px',
        }}
      >
        <table style={TABLE_STYLES}>
          <thead>
            <tr>
              <th style={thStyles}>Name</th>
              <th style={thStyles}>Owner</th>
              <th style={thStyles}>Shared</th>
              <th style={{ ...thStyles, whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Create
                  {user && (
                    <button
                      onClick={onCreateSpace}
                      style={BTN_STYLES}
                      title="Create new space"
                    >
                      +
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Owned Spaces */}
            {hasOwnedSpaces && (
              <>
                <tr>
                  <td colSpan="4" style={{ ...tdStyles, ...categoryRowStyles }}>
                    Your Spaces
                  </td>
                </tr>
                {userSpaces.owned.map((space) => (
                  <tr key={`owned-${space.id}`}>
                    <td style={tdStyles}>
                      <a
                        href="#"
                        rel="noopener noreferrer"
                        style={{
                          ...LINK_STYLES,
                          opacity: navigatingSpaceId === space.id ? 0.5 : 1,
                          pointerEvents: navigatingSpaceId ? 'none' : 'auto',
                        }}
                        onClick={(e) => handleSpaceClick(e, space.id, undefined, space.type)}
                      >
                        {navigatingSpaceId === space.id
                          ? 'Opening...'
                          : `${space.type === 'earth' ? '🌍 ' : ''}${space.name}`}
                      </a>
                    </td>
                    <td style={tdStyles}>
                      {user
                        ? user.displayName || user.email.split('@')[0]
                        : 'Unknown'}
                    </td>
                    <td style={tdStyles}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {space.isPublic ||
                        (space.sharedWith &&
                          (space.sharedWith.includes('everyone') ||
                            space.sharedWith === 'everyone'))
                          ? 'Open'
                          : space.sharedWith && space.sharedWith.length > 0
                          ? 'Shared'
                          : 'Private'}
                        <button
                          style={SHARE_BTN_STYLES}
                          title="Share with someone"
                          onClick={() => onShareSpace(space)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={tdStyles}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {new Date(space.createdAt).toLocaleDateString()}
                        {space.isOwner && (
                          <button
                            style={TRASH_BTN_STYLES}
                            title="Delete space"
                            onClick={() => onDeleteSpace(space.id)}
                            disabled={isDeleting}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Shared Spaces */}
            {hasSharedSpaces && (
              <>
                <tr>
                  <td colSpan="4" style={{ ...tdStyles, ...categoryRowStyles }}>
                    Shared With You
                  </td>
                </tr>
                {userSpaces.shared.map((space) => (
                  <tr key={`shared-${space.id}`}>
                    <td style={tdStyles}>
                      <a
                        href="#"
                        rel="noopener noreferrer"
                        style={{
                          ...LINK_STYLES,
                          opacity: navigatingSpaceId === space.id ? 0.5 : 1,
                          pointerEvents: navigatingSpaceId ? 'none' : 'auto',
                        }}
                        onClick={(e) =>
                          handleSpaceClick(e, space.id, space.ownerId, space.type)
                        }
                      >
                        {navigatingSpaceId === space.id
                          ? 'Opening...'
                          : `${space.type === 'earth' ? '🌍 ' : ''}${space.name}`}
                      </a>
                    </td>
                    <td style={tdStyles}>
                      {space.ownerEmail
                        ? space.ownerEmail.split('@')[0]
                        : 'Unknown'}
                    </td>
                    <td style={tdStyles}>Shared</td>
                    <td style={tdStyles}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {new Date(space.createdAt).toLocaleDateString()}
                        <button
                          className="leave-space-btn"
                          style={LEAVE_BTN_STYLES}
                          title="Leave this shared space"
                          onClick={() => onLeaveSpace(space)}
                          disabled={isDeleting}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* No spaces message */}
            {!hasOwnedSpaces && !hasSharedSpaces && (
              <tr>
                <td colSpan="4" style={{ ...tdStyles, ...NO_SPACES_TEXT }}>
                  No spaces found. Create your first space!
                </td>
              </tr>
            )}

          </tbody>
        </table>

        {/* Pending organization invites */}
        {Array.isArray(pendingInvites) &&
          pendingInvites.length > 0 &&
          pendingInvites.map(({ org }) => (
            <div
              key={org.id}
              style={inviteBannerStyle}
            >
              <span style={INVITE_TEXT_STYLES}>
                You've been invited to join{' '}
                <strong>{org.name}</strong>
              </span>
              <div style={INVITE_BTN_ROW}>
                <button
                  onClick={() => onAcceptInvite(org.id)}
                  className="invite-accept-btn"
                  style={ACCEPT_BTN_STYLES}
                >
                  Accept
                </button>
                <button
                  onClick={() => onDeclineInvite(org.id)}
                  className="invite-decline-btn"
                  style={ACCEPT_BTN_STYLES}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
      </div>
    );
  }
);
