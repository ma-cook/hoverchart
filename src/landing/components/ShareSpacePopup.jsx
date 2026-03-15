import React, { useState } from 'react';

export const ShareSpacePopup = React.memo(
  ({
    show,
    space,
    email,
    isSharing,
    error,
    onChangeEmail,
    onCancel,
    onShare,
  }) => {
    const [isUnrestricted, setIsUnrestricted] = useState(false);

    if (!show || !space) return null;

    const spaceName = space?.name || 'this space';

    const handleShare = () => {
      onShare(isUnrestricted ? 'everyone' : email);
    };

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
            width: '300px',
            border: '1px solid rgba(0,0,0,0.1)',
            color: '#333',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
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

          <div style={{ marginBottom: '15px' }}>
            <label
              htmlFor="shareEmail"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                fontSize: '14px',
              }}
            >
              Share with (email):
            </label>
            <input
              id="shareEmail"
              type="email"
              value={email}
              onChange={(e) => onChangeEmail(e.target.value)}
              disabled={isUnrestricted}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxSizing: 'border-box',
                fontSize: '14px',
                fontFamily: 'inherit',
                opacity: isUnrestricted ? 0.5 : 1,
              }}
              placeholder="Enter email address"
              autoFocus={!isUnrestricted}
            />
          </div>

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
                onChange={(e) => setIsUnrestricted(e.target.checked)}
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
              disabled={(!email.trim() && !isUnrestricted) || isSharing}
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
