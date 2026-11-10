import React, { useState, useMemo, useEffect } from 'react';
import './ShareSpacePopup.css';

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
    organization,
    organizationMembers,
    currentUserId,
  }) => {
    const [isUnrestricted, setIsUnrestricted] = useState(false);
    const [shareWithOrg, setShareWithOrg] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      if (!show) return;
      setIsUnrestricted(false);
      setShareWithOrg(false);
      setSelectedMembers(new Set());
      setSearchQuery('');
    }, [show, space?.id]);

    const otherMembers = useMemo(
      () =>
        Array.isArray(organizationMembers)
          ? organizationMembers.filter((m) => m.userId !== currentUserId)
          : [],
      [organizationMembers, currentUserId]
    );

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

    if (!show || !space) return null;

    const toggleMember = (userId) => {
      setIsUnrestricted(false);
      setShareWithOrg(false);
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

    const handleUnrestrictedChange = (checked) => {
      setIsUnrestricted(checked);
      if (checked) {
        setShareWithOrg(false);
        setSelectedMembers(new Set());
      }
    };

    const handleOrgChange = (checked) => {
      setShareWithOrg(checked);
      if (checked) {
        setIsUnrestricted(false);
        setSelectedMembers(new Set());
      }
    };

    const handleShare = () => {
      if (isUnrestricted) {
        onShare({ type: 'everyone' });
      } else if (shareWithOrg && organization) {
        onShare({ type: 'organization', orgId: organization.id });
      } else if (selectedMembers.size > 0) {
        onShare({ type: 'members', userIds: [...selectedMembers] });
      }
    };

    const membersDisabled = isUnrestricted || shareWithOrg;
    const isShareDisabled =
      isSharing || (!isUnrestricted && !shareWithOrg && selectedMembers.size === 0);

    return (
      <div className="share-popup-overlay">
        <div className="share-popup-card">
          <h3 className="share-popup-title">Share</h3>

          {organization && (
            <div className="share-popup-section">
              <span className="share-popup-label">Organization</span>
              <label
                className={`share-popup-option ${
                  shareWithOrg ? 'share-popup-option--active' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={shareWithOrg}
                  onChange={(e) => handleOrgChange(e.target.checked)}
                />
                <span className="share-popup-option-text">
                  <span className="share-popup-option-title">
                    All members of {organization.name}
                  </span>
                  <span className="share-popup-option-meta">
                    Everyone in the organization gets access
                  </span>
                </span>
              </label>
            </div>
          )}

          {hasOrgMembers && (
            <div className="share-popup-section">
              <span className="share-popup-label">Share with members</span>
              <input
                type="text"
                className="share-popup-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                disabled={membersDisabled}
              />
              <div
                className={`share-popup-member-list ${
                  membersDisabled ? 'share-popup-member-list--disabled' : ''
                }`}
              >
                {filteredMembers.length === 0 ? (
                  <div className="share-popup-empty">No members found</div>
                ) : (
                  filteredMembers.map((member) => {
                    const isChecked = selectedMembers.has(member.userId);
                    const displayName = member.displayName || member.email;
                    const initials = getInitials(member.displayName, member.email);
                    const avatarColor = stringToColor(member.email || member.userId);

                    return (
                      <label
                        key={member.userId}
                        className={`share-popup-member ${
                          isChecked ? 'share-popup-member--checked' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(member.userId)}
                          disabled={membersDisabled}
                        />
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt=""
                            className="share-popup-avatar"
                          />
                        ) : (
                          <span
                            className="share-popup-avatar"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </span>
                        )}
                        <span className="share-popup-member-main">
                          <span className="share-popup-member-name">{displayName}</span>
                          {member.displayName &&
                            member.email &&
                            member.email !== member.displayName && (
                              <span className="share-popup-member-email">
                                {member.email}
                              </span>
                            )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div className="share-popup-section">
            <label
              className={`share-popup-option ${
                isUnrestricted ? 'share-popup-option--active' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isUnrestricted}
                onChange={(e) => handleUnrestrictedChange(e.target.checked)}
              />
              <span className="share-popup-option-text">
                <span className="share-popup-option-title">
                  Unrestricted (open to everyone)
                </span>
                <span className="share-popup-option-meta">
                  Anyone with the link can open this space
                </span>
              </span>
            </label>
          </div>

          {error && <div className="share-popup-error">{error}</div>}

          <div className="share-popup-actions">
            <button
              className="share-popup-btn share-popup-btn--secondary"
              onClick={onCancel}
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              className="share-popup-btn share-popup-btn--primary"
              onClick={handleShare}
              disabled={isShareDisabled}
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
