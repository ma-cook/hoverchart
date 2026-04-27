import { useEffect, useState } from 'react';
import { subscribeToSpacePresence } from '../services/presenceService';
import useHandTrackingStore from '../stores/handTrackingStore';
import {
  startHandTracking,
  stopHandTracking,
} from '../services/handTrackingService';

/**
 * Derives up-to-two initials from a display name.
 */
const getInitials = (displayName) => {
  if (!displayName) return '?';
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * A single round avatar chip.
 */
const Avatar = ({ user }) => {
  const [imgError, setImgError] = useState(false);

  const tooltipLabel = user.isGuest
    ? 'Guest'
    : user.displayName || 'User';

  const style = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: user.isGuest ? '#888' : '#4a90d9',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.6)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    flexShrink: 0,
    cursor: 'default',
    userSelect: 'none',
    position: 'relative',
  };

  return (
    <div style={style} title={tooltipLabel}>
      {user.isGuest ? (
        'G'
      ) : user.photoURL && !imgError ? (
        <img
          src={user.photoURL}
          alt={tooltipLabel}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        getInitials(user.displayName)
      )}
    </div>
  );
};

/**
 * Toggle button that enables / disables hand tracking.
 * Reads state from handTrackingStore; calls service functions on click.
 */
const HandTrackingToggle = () => {
  const enabled = useHandTrackingStore((s) => s.enabled);
  const fps = useHandTrackingStore((s) => s.fps);
  const error = useHandTrackingStore((s) => s.error);
  const [transitioning, setTransitioning] = useState(false);

  const handleClick = async () => {
    setTransitioning(true);
    try {
      if (enabled) {
        await stopHandTracking();
      } else {
        await startHandTracking();
      }
    } finally {
      setTransitioning(false);
    }
  };

  const label = enabled ? `🖐 Hands · ${fps} fps` : '🖐 Hands';

  const btnStyle = {
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: '3px 8px',
    borderRadius: 12,
    border: error ? '1.5px solid #e74c3c' : '1.5px solid transparent',
    cursor: transitioning ? 'wait' : 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    outline: 'none',
    opacity: transitioning ? 0.6 : 1,
  };

  return (
    <button
      style={btnStyle}
      onClick={handleClick}
      disabled={transitioning}
      title={error}
    >
      {label}
    </button>
  );
};

/**
 * Displays small round avatars for all users currently present in the given space.
 * Rendered in the top-right corner of the screen.
 */
const SpacePresenceAvatars = ({ spaceId, currentCell }) => {
  const [presentUsers, setPresentUsers] = useState([]);

  useEffect(() => {
    if (!spaceId) {
      setPresentUsers([]);
      return;
    }

    const unsubscribe = subscribeToSpacePresence(spaceId, (users) => {
      setPresentUsers(users);
    });

    return unsubscribe;
  }, [spaceId]);

  const cellLabel = currentCell
    ? `${currentCell.x},${currentCell.y},${currentCell.z}`
    : '0,0,0';

  const containerStyle = {
    position: 'fixed',
    top: 12,
    right: 12,
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    zIndex: 9999,
    alignItems: 'center',
  };

  const pillStyle = {
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: '3px 8px',
    borderRadius: 12,
    userSelect: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      <HandTrackingToggle />
      <div style={pillStyle}>{cellLabel}</div>
      {presentUsers.map((u) => (
        <Avatar key={u.userId} user={u} />
      ))}
    </div>
  );
};

SpacePresenceAvatars.displayName = 'SpacePresenceAvatars';
export default SpacePresenceAvatars;
