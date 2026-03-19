import React from 'react';

export const UserLoginSection = React.memo(
  ({ user, windowSize, onLogin, onLogout, onOpenOrgManager, pendingInviteCount = 0 }) => {
    return (
      <div
        style={{
          position: 'absolute',
          top: windowSize.width > 768 ? '7%' : '6%',
          left: windowSize.width > 768 ? '90%' : '90%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: windowSize.width > 768 ? '0.9rem' : '0.25rem',
          color: 'black',
          zIndex: 10,
          width: windowSize.width > 768 ? '10rem' : '10rem',
          display: 'flex',
          flexDirection: 'column',
          fontSize: windowSize.width > 768 ? '1rem' : '0.75rem',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', color: 'black' }}>
          {user ? (
            <>
              <span
                style={{
                  marginRight: '10px',
                  color: '#333',
                  fontSize: windowSize.width > 768 ? '1rem' : '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: '500',
                }}
              >
                {user.displayName || user.email}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={onLogout}
                  style={{
                    color: '#333',
                    backgroundColor: 'white',
                    border: '1px solid #aaaaaa',
                    borderRadius: '4px',
                    fontSize: windowSize.width > 768 ? '0.8rem' : '0.6rem',
                    padding:
                      windowSize.width > 768 ? '0.4rem 0.6rem' : '0.3rem 0.5rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Logout
                </button>
                <button
                  onClick={onOpenOrgManager}
                  style={{
                    color: '#333',
                    backgroundColor: 'white',
                    border: '1px solid #aaaaaa',
                    borderRadius: '4px',
                    fontSize: windowSize.width > 768 ? '0.8rem' : '0.6rem',
                    padding:
                      windowSize.width > 768 ? '0.4rem 0.6rem' : '0.3rem 0.5rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  Organization
                  {pendingInviteCount > 0 && (
                    <span
                      aria-label={`${pendingInviteCount} pending organization invite${pendingInviteCount !== 1 ? 's' : ''}`}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        lineHeight: 1,
                      }}
                    >
                      {pendingInviteCount}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={onLogin}
                style={{
                  color: '#333',
                  backgroundColor: 'white',
                  border: '1px solid #aaaaaa',
                  borderRadius: '4px',
                  marginRight: '5px',
                  fontSize: windowSize.width > 768 ? '0.8rem' : '0.6rem',
                  padding:
                    windowSize.width > 768 ? '0.4rem 0.6rem' : '0.3rem 0.5rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Login
              </button>
              <button
                onClick={onLogin}
                style={{
                  color: '#333',
                  backgroundColor: 'white',
                  border: '1px solid #aaaaaa',
                  borderRadius: '4px',
                  fontSize: windowSize.width > 768 ? '0.8rem' : '0.6rem',
                  padding:
                    windowSize.width > 768 ? '0.4rem 0.6rem' : '0.3rem 0.5rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
);
