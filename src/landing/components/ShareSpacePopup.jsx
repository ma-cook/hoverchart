import React, { useState, useMemo } from 'react';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

// Generate a consistent color from a string (for avatar backgrounds)
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};

const getInitials = (displayName, email) => {
  if (displayName && displayName !== email) {
    return displayName
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  return (email || '?')[0].toUpperCase();
};

export const ShareSpacePopup = React.memo(
  ({
    show,
    space,
    isSharing,
    error,
    onCancel,
    onShare,
    organizationMembers,
    currentUserId,
  }) => {
    const [isUnrestricted, setIsUnrestricted] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    if (!show || !space) return null;

    // Filter out current user, only show other org members
    const otherMembers = Array.isArray(organizationMembers)
      ? organizationMembers.filter((m) => m.userId !== currentUserId)
      : [];

    // Only show the member list when there are other members in the org (>1 total including current user)
    const hasOrgMembers = otherMembers.length > 0;

    const filteredMembers = useMemo(() => {
      if (!searchQuery.trim()) return otherMembers;
      const q = searchQuery.toLowerCase();
      return otherMembers.filter(
        (m) =>
          (m.displayName || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q)
      );
    }, [otherMembers, searchQuery]);

    const toggleMember = (userId) => {
      setSelectedMembers((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    };

    const handleShare = () => {
      if (isUnrestricted) {
        onShare('everyone');
      } else if (hasOrgMembers && selectedMembers.size > 0) {
        // Share with all selected members
        const emails = otherMembers
          .filter((m) => selectedMembers.has(m.userId))
          .map((m) => m.email);
        // Call onShare for each selected member
        for (const email of emails) {
          onShare(email);
        }
      }
    };

    const isShareDisabled =
      isSharing || (!isUnrestricted && selectedMembers.size === 0);

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '340px',
            maxWidth: '90vw',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#333',
            fontFamily: FONT_FAMILY,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <h3
            style={{
              margin: '0 0 15px 0',
              fontWeight: '500',
              fontSize: '18px',
            }}
          >
            Share
          </h3>

          {/* Member list — only when org has other members */}
          {hasOrgMembers && (
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  fontSize: '14px',
                }}
              >
                Share with members:
              </label>
              {/* Search input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                disabled={isUnrestricted}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px 4px 0 0',
                  boxSizing: 'border-box',
                  fontSize: '13px',
                  fontFamily: FONT_FAMILY,
                  opacity: isUnrestricted ? 0.5 : 1,
                }}
              />
              {/* Member list with checkboxes */}
              <div
                style={{
                  border: '1px solid #ddd',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  opacity: isUnrestricted ? 0.5 : 1,
                  pointerEvents: isUnrestricted ? 'none' : 'auto',
                }}
              >
                {filteredMembers.length === 0 ? (
                  <div
                    style={{
                      padding: '12px',
                      fontSize: '13px',
                      color: '#999',
                      textAlign: 'center',
                    }}
                  >
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const isChecked = selectedMembers.has(member.userId);
                    const initials = getInitials(member.displayName, member.email);
                    const avatarColor = stringToColor(member.email || member.userId);

                    return (
                      <label
                        key={member.userId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f5f5f5',
                          backgroundColor: isChecked ? '#f0f7ff' : 'white',
                          transition: 'background-color 0.15s',
                          userSelect: 'none',
                        }}
                        onMouseOver={(e) => {
                          if (!isChecked) e.currentTarget.style.backgroundColor = '#fafafa';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = isChecked ? '#f0f7ff' : 'white';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(member.userId)}
                          style={{ marginRight: '10px', flexShrink: 0 }}
                        />
                        {/* Avatar */}
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt=""
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              marginRight: '10px',
                              flexShrink: 0,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              marginRight: '10px',
                              flexShrink: 0,
                              backgroundColor: avatarColor,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {initials}
                          </div>
                        )}
                        {/* Name and email */}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {member.displayName || member.email}
                          </div>
                          {member.displayName && member.email !== member.displayName && (
                            <div
                              style={{
                                fontSize: '11px',
                                color: '#999',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {member.email}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Unrestricted checkbox — always shown */}
          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={isUnrestricted}
                onChange={(e) => {
                  setIsUnrestricted(e.target.checked);
                  if (e.target.checked) setSelectedMembers(new Set());
                }}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                Unrestricted (open to everyone)
              </span>
            </label>
          </div>

          {error && (
            <div
              style={{
                color: '#e53e3e',
                marginBottom: '15px',
                fontSize: '14px',
                fontWeight: '400',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                padding: '10px 16px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              disabled={isSharing}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = '#f5f5f5')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'white')
              }
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              style={{
                padding: '10px 16px',
                backgroundColor: 'black',
                color: 'white',
                border: '1px solid black',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'inherit',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              disabled={isShareDisabled}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = '#333')
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = 'black')
              }
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
