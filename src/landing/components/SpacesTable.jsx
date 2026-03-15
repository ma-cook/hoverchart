import React, { useState } from 'react';

export const SpacesTable = React.memo(
  ({
    userSpaces,
    windowSize,
    user,
    isDeleting,
    onNavigateToSpace,
    onCreateSpace,
    onShareSpace,
    onDeleteSpace,
    onLeaveSpace,
  }) => {
    const [navigatingSpaceId, setNavigatingSpaceId] = useState(null);

    const handleSpaceClick = async (e, spaceId, ownerId) => {
      e.preventDefault();
      if (navigatingSpaceId) return;
      setNavigatingSpaceId(spaceId);
      try {
        await onNavigateToSpace(spaceId, ownerId);
      } finally {
        setNavigatingSpaceId(null);
      }
    };

    // Style objects
    const tableStyles = {
      width: '100%',
      backgroundColor: 'white',
      borderCollapse: 'collapse',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    };

    const thStyles = {
      backgroundColor: '#f8f8f8',
      padding: windowSize.width <= 480 ? '8px' : '12px',
      textAlign: 'left',
      fontWeight: '500',
      borderBottom: '1px solid #ddd',
      color: '#333',
      fontSize: windowSize.width <= 480 ? '12px' : '14px',
    };

    const tdStyles = {
      padding: windowSize.width <= 480 ? '8px' : '12px',
      borderBottom: '1px solid #eee',
      fontSize: windowSize.width <= 480 ? '12px' : '14px',
      color: '#333',
      fontWeight: '400',
    };

    const categoryRowStyles = {
      backgroundColor: '#f0f0f0',
      fontWeight: 'bold',
      fontSize: windowSize.width <= 480 ? '13px' : '15px',
    };

    const linkStyles = {
      color: '#0066cc',
      textDecoration: 'none',
    };

    const buttonStyles = {
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

    const shareButtonStyle = {
      ...buttonStyles,
      marginLeft: '10px',
    };

    const trashButtonStyle = {
      ...buttonStyles,
      marginLeft: '5px',
    };

    const leaveButtonStyle = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      width: '26px',
      height: '26px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255,235,235,0.7)',
      border: '1px solid rgba(220,53,69,0.3)',
      fontSize: '14px',
      color: '#dc3545',
      marginLeft: '5px',
      transition: 'all 0.2s',
    };

    const hasOwnedSpaces = userSpaces.owned.length > 0;
    const hasSharedSpaces = userSpaces.shared.length > 0;

    return (
      <div
        style={{
          width: '100%',
          overflow: 'auto',
          padding: windowSize.width <= 480 ? '5px' : '10px',
        }}
      >
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Name</th>
              <th style={thStyles}>Owner</th>
              <th style={thStyles}>Shared</th>
              <th style={thStyles}>Create</th>
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
                          ...linkStyles,
                          opacity: navigatingSpaceId === space.id ? 0.5 : 1,
                          pointerEvents: navigatingSpaceId ? 'none' : 'auto',
                        }}
                        onClick={(e) => handleSpaceClick(e, space.id)}
                      >
                        {navigatingSpaceId === space.id
                          ? 'Opening...'
                          : space.name}
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
                          style={shareButtonStyle}
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
                            style={trashButtonStyle}
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
                          ...linkStyles,
                          opacity: navigatingSpaceId === space.id ? 0.5 : 1,
                          pointerEvents: navigatingSpaceId ? 'none' : 'auto',
                        }}
                        onClick={(e) =>
                          handleSpaceClick(e, space.id, space.ownerId)
                        }
                      >
                        {navigatingSpaceId === space.id
                          ? 'Opening...'
                          : space.name}
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
                          style={leaveButtonStyle}
                          title="Leave this shared space"
                          onClick={() => onLeaveSpace(space)}
                          disabled={isDeleting}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'rgba(255,235,235,0.9)';
                            e.currentTarget.style.borderColor =
                              'rgba(220,53,69,0.5)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'rgba(255,235,235,0.7)';
                            e.currentTarget.style.borderColor =
                              'rgba(220,53,69,0.3)';
                          }}
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
                <td colSpan="4" style={{ ...tdStyles, textAlign: 'center' }}>
                  No spaces found. Create your first space!
                </td>
              </tr>
            )}

            {/* Create new space row */}
            {user && (
              <tr>
                <td colSpan="3" style={tdStyles}></td>
                <td style={tdStyles}>
                  <button
                    onClick={onCreateSpace}
                    style={buttonStyles}
                    title="Create new space"
                  >
                    +
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
);
