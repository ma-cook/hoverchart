import React, { useState, useRef, useEffect } from 'react';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

export const OrgMemberDropdown = React.memo(
  ({
    members = [],
    selectedUserId,
    onSelect,
    disabled = false,
    placeholder = 'Search members...',
  }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedMember = members.find((m) => m.userId === selectedUserId);

    const filtered = members.filter((m) => {
      const q = query.toLowerCase();
      return (
        (m.displayName || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      );
    });

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputFocus = () => {
      if (!disabled) setOpen(true);
    };

    const handleInputChange = (e) => {
      setQuery(e.target.value);
      setOpen(true);
    };

    const handleSelect = (member) => {
      onSelect(member);
      setQuery('');
      setOpen(false);
    };

    const displayValue = open
      ? query
      : selectedMember
        ? `${selectedMember.displayName || selectedMember.email} (${selectedMember.email})`
        : query;

    return (
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: open ? '4px 4px 0 0' : '4px',
            boxSizing: 'border-box',
            fontSize: '14px',
            fontFamily: FONT_FAMILY,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          autoComplete="off"
        />
        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 100,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: '10px',
                  fontSize: '14px',
                  color: '#999',
                  fontFamily: FONT_FAMILY,
                }}
              >
                No members found
              </div>
            ) : (
              filtered.map((member) => (
                <div
                  key={member.userId}
                  onMouseDown={() => handleSelect(member)}
                  style={{
                    padding: '10px',
                    fontSize: '14px',
                    fontFamily: FONT_FAMILY,
                    cursor: 'pointer',
                    backgroundColor:
                      member.userId === selectedUserId ? '#f5f5f5' : 'white',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f5f5f5')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      member.userId === selectedUserId ? '#f5f5f5' : 'white')
                  }
                >
                  {member.displayName || member.email}
                  {member.displayName && member.email !== member.displayName && (
                    <span style={{ color: '#999', marginLeft: '6px' }}>
                      ({member.email})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
);
