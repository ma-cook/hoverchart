import React, { useState, useEffect, useCallback } from 'react';
import {
  createOrganization,
  getUserOrganizations,
  inviteUserToOrganization,
  acceptInvite,
  declineInvite,
  removeMemberFromOrganization,
  leaveOrganization,
  updateOrganizationPlan,
  deleteOrganization,
  getPendingInvitesForUser,
  PLAN_LIMITS,
} from '../../services/organizationService';

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";

const PLAN_LABELS = { free: 'Free', team: 'Team', business: 'Business' };

const btnBase = {
  padding: '8px 14px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: FONT_FAMILY,
  fontWeight: '500',
  transition: 'background-color 0.2s',
  border: '1px solid #ddd',
};
const btnPrimary = {
  ...btnBase,
  backgroundColor: 'black',
  color: 'white',
  border: '1px solid black',
};
const btnSecondary = { ...btnBase, backgroundColor: 'white', color: '#333' };
const btnDanger = {
  ...btnBase,
  backgroundColor: 'white',
  color: '#e53e3e',
  border: '1px solid #e53e3e',
};

export const OrganizationManager = React.memo(({ user, show, onClose }) => {
  const [orgs, setOrgs] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create org form
  const [createMode, setCreateMode] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreating, setIsCreating] = useState(false);

  // Invite form state per org (keyed by orgId)
  const [inviteEmail, setInviteEmail] = useState({});
  const [inviteLoading, setInviteLoading] = useState({});
  const [inviteError, setInviteError] = useState({});

  // Plan upgrade state per org
  const [upgradePlan, setUpgradePlan] = useState({});

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedOrgs, fetchedInvites] = await Promise.allSettled([
        getUserOrganizations(user.uid),
        getPendingInvitesForUser(user.email),
      ]);
      // Only update orgs if the fetch succeeded — don't wipe existing local state on failure
      if (fetchedOrgs.status === 'fulfilled') {
        setOrgs(fetchedOrgs.value);
      }
      if (fetchedInvites.status === 'fulfilled') {
        setPendingInvites(fetchedInvites.value);
      }
    } catch {
      // Don't wipe existing state on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (show && user) {
      // Clear notifications from previous session
      setError('');
      setSuccess('');
      refresh();
    }
  }, [show, user, refresh]);

  if (!show) return null;

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setIsCreating(true);
    setError('');
    try {
      const newOrg = await createOrganization(user.uid, newOrgName.trim(), newOrgPlan);
      setNewOrgName('');
      setNewOrgPlan('free');
      setCreateMode(false);
      setSuccess('Organization created!');
      // Use the returned org data directly — avoids any Firestore read-after-write timing issues
      setOrgs((prev) => [...prev, newOrg]);
    } catch (e) {
      setError(e.message || 'Failed to create organization.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInvite = async (orgId) => {
    const email = (inviteEmail[orgId] || '').trim();
    if (!email) return;
    setInviteLoading((prev) => ({ ...prev, [orgId]: true }));
    setInviteError((prev) => ({ ...prev, [orgId]: '' }));
    try {
      await inviteUserToOrganization(orgId, user.uid, email);
      setInviteEmail((prev) => ({ ...prev, [orgId]: '' }));
      setSuccess('Invite sent!');
      await refresh();
    } catch (e) {
      setInviteError((prev) => ({
        ...prev,
        [orgId]: e.message || 'Failed to send invite.',
      }));
    } finally {
      setInviteLoading((prev) => ({ ...prev, [orgId]: false }));
    }
  };

  const handleRemoveMember = async (orgId, targetUserId) => {
    setError('');
    try {
      await removeMemberFromOrganization(orgId, user.uid, targetUserId);
      setSuccess('Member removed.');
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to remove member.');
    }
  };

  const handleLeave = async (orgId) => {
    setError('');
    try {
      await leaveOrganization(orgId, user.uid);
      setSuccess('You have left the organization.');
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to leave organization.');
    }
  };

  const handleUpgradePlan = async (orgId) => {
    const plan = upgradePlan[orgId];
    if (!plan) return;
    setError('');
    try {
      await updateOrganizationPlan(orgId, user.uid, plan);
      setSuccess('Plan updated.');
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to update plan.');
    }
  };

  const handleDeleteOrg = async (orgId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this organization? This cannot be undone.'
      )
    )
      return;
    setError('');
    try {
      await deleteOrganization(orgId, user.uid);
      setSuccess('Organization deleted.');
      setExpandedOrg(null);
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to delete organization.');
    }
  };

  const handleAcceptInvite = async (orgId) => {
    setError('');
    try {
      await acceptInvite(orgId, user.uid, user.email);
      setSuccess('You have joined the organization!');
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to accept invite.');
    }
  };

  const handleDeclineInvite = async (orgId) => {
    setError('');
    try {
      await declineInvite(orgId, user.email);
      setSuccess('Invite declined.');
      await refresh();
    } catch (e) {
      setError(e.message || 'Failed to decline invite.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        fontFamily: FONT_FAMILY,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          width: '480px',
          maxWidth: '95vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          border: '1px solid rgba(0,0,0,0.1)',
          color: '#333',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ margin: 0, fontWeight: '600', fontSize: '18px' }}>
            Organization
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div
            style={{
              color: '#e53e3e',
              marginBottom: '12px',
              fontSize: '14px',
              padding: '8px 12px',
              backgroundColor: '#fff5f5',
              borderRadius: '4px',
              border: '1px solid #fed7d7',
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              color: '#276749',
              marginBottom: '12px',
              fontSize: '14px',
              padding: '8px 12px',
              backgroundColor: '#f0fff4',
              borderRadius: '4px',
              border: '1px solid #c6f6d5',
            }}
          >
            {success}
          </div>
        )}

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#555',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Pending Invites
            </h4>
            {pendingInvites.map(({ org }) => (
              <div
                key={org.id}
                style={{
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>
                    {org.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {PLAN_LABELS[org.plan] || org.plan} plan ·{' '}
                    {(org.members || []).length}/{org.memberLimit} members
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleAcceptInvite(org.id)}
                    style={btnPrimary}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#333')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = 'black')
                    }
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvite(org.id)}
                    style={btnSecondary}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#f5f5f5')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = 'white')
                    }
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Organizations */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '12px',
            }}
          >
            {!createMode && orgs.length === 0 && (
              <button
                onClick={() => {
                  setCreateMode(true);
                  setError('');
                  setSuccess('');
                }}
                style={btnPrimary}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = '#333')
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = 'black')
                }
              >
                + New
              </button>
            )}
          </div>

          {/* Create Org Form */}
          {createMode && (
            <div
              style={{
                padding: '16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '16px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                  }}
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: FONT_FAMILY,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '500',
                    fontSize: '13px',
                  }}
                >
                  Plan
                </label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: FONT_FAMILY,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="free">Free (up to 3 members)</option>
                  <option value="team">Team (up to 10 members)</option>
                  <option value="business">Business (up to 50 members)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCreateOrg}
                  disabled={!newOrgName.trim() || isCreating}
                  style={btnPrimary}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = '#333')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = 'black')
                  }
                >
                  {isCreating ? 'Creating…' : 'Create Organization'}
                </button>
                <button
                  onClick={() => {
                    setCreateMode(false);
                    setNewOrgName('');
                  }}
                  style={btnSecondary}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f5f5f5')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = 'white')
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Org List */}
          {!loading && orgs.length === 0 && !createMode && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: '#999',
                fontSize: '14px',
                border: '1px dashed #ddd',
                borderRadius: '6px',
              }}
            >
              No organizations yet. Create one to get started.
            </div>
          )}

          {orgs.map((org) => {
            const isAdmin = (org.members || []).some(
              (m) => m.userId === user.uid && m.role === 'admin'
            );
            const memberCount = (org.members || []).length;
            const isAtCapacity = memberCount >= org.memberLimit;
            const isExpanded = expandedOrg === org.id;

            return (
              <div
                key={org.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* Org Header Row */}
                <div
                  onClick={() =>
                    setExpandedOrg(isExpanded ? null : org.id)
                  }
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#fafafa' : 'white',
                    borderBottom: isExpanded ? '1px solid #eee' : 'none',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '500', fontSize: '15px' }}>
                      {org.name}
                    </span>
                    <span
                      style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor:
                          org.plan === 'business'
                            ? '#ebf8ff'
                            : org.plan === 'team'
                              ? '#f0fff4'
                              : '#fffff0',
                        color:
                          org.plan === 'business'
                            ? '#2b6cb0'
                            : org.plan === 'team'
                              ? '#276749'
                              : '#744210',
                      }}
                    >
                      {PLAN_LABELS[org.plan] || org.plan}
                    </span>
                    {isAdmin && (
                      <span
                        style={{
                          marginLeft: '6px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#e9d8fd',
                          color: '#553c9a',
                        }}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        color: isAtCapacity ? '#e53e3e' : '#666',
                        fontWeight: isAtCapacity ? '600' : '400',
                      }}
                    >
                      {memberCount}/{org.memberLimit}
                    </span>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded Panel */}
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    {/* Capacity warning */}
                    {isAtCapacity && (
                      <div
                        style={{
                          color: '#e53e3e',
                          fontSize: '13px',
                          marginBottom: '12px',
                          padding: '8px 12px',
                          backgroundColor: '#fff5f5',
                          borderRadius: '4px',
                          border: '1px solid #fed7d7',
                        }}
                      >
                        Organization limit reached ({memberCount}/
                        {org.memberLimit}). Upgrade your plan to add more
                        members.
                      </div>
                    )}

                    {/* Member List */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#555',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>Members ({memberCount}/{org.memberLimit})</span>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Toggle invite form visibility
                              setInviteEmail((prev) => {
                                const isShowing = prev[`_show_${org.id}`];
                                return { ...prev, [`_show_${org.id}`]: !isShowing };
                              });
                            }}
                            style={{
                              ...btnPrimary,
                              padding: '2px 10px',
                              fontSize: '14px',
                              lineHeight: '1',
                              opacity: isAtCapacity ? 0.5 : 1,
                              cursor: isAtCapacity ? 'not-allowed' : 'pointer',
                            }}
                            disabled={isAtCapacity}
                            title={isAtCapacity ? 'Organization at capacity' : 'Invite member'}
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          maxHeight: '180px',
                          overflowY: 'auto',
                          border: '1px solid #eee',
                          borderRadius: '4px',
                        }}
                      >
                        {(org.members || []).map((member) => (
                          <div
                            key={member.userId}
                            style={{
                              padding: '8px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: '1px solid #f5f5f5',
                              fontSize: '13px',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: '500' }}>
                                {member.displayName || member.email}
                              </span>
                              {member.displayName &&
                                member.email !== member.displayName && (
                                  <span style={{ color: '#999', marginLeft: '6px' }}>
                                    {member.email}
                                  </span>
                                )}
                              <span
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '11px',
                                  color:
                                    member.role === 'admin' ? '#553c9a' : '#666',
                                  fontWeight:
                                    member.role === 'admin' ? '600' : '400',
                                }}
                              >
                                {member.role}
                              </span>
                            </div>
                            {isAdmin &&
                              member.userId !== user.uid &&
                              member.role !== 'admin' && (
                                <button
                                  onClick={() =>
                                    handleRemoveMember(org.id, member.userId)
                                  }
                                  style={{
                                    ...btnDanger,
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                  }}
                                  onMouseOver={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      '#fff5f5')
                                  }
                                  onMouseOut={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      'white')
                                  }
                                >
                                  Remove
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin Controls */}
                    {isAdmin && (
                      <>
                        {/* Invite - shown when + is clicked */}
                        {inviteEmail[`_show_${org.id}`] && (
                        <div style={{ marginBottom: '16px' }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555',
                              marginBottom: '8px',
                            }}
                          >
                            Invite Member
                          </div>
                          {inviteError[org.id] && (
                            <div
                              style={{
                                color: '#e53e3e',
                                fontSize: '13px',
                                marginBottom: '8px',
                              }}
                            >
                              {inviteError[org.id]}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="email"
                              value={inviteEmail[org.id] || ''}
                              onChange={(e) =>
                                setInviteEmail((prev) => ({
                                  ...prev,
                                  [org.id]: e.target.value,
                                }))
                              }
                              placeholder="Email address"
                              disabled={isAtCapacity}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: FONT_FAMILY,
                                opacity: isAtCapacity ? 0.5 : 1,
                              }}
                            />
                            <button
                              onClick={() => handleInvite(org.id)}
                              disabled={
                                isAtCapacity ||
                                !inviteEmail[org.id]?.trim() ||
                                inviteLoading[org.id]
                              }
                              style={{
                                ...btnPrimary,
                                opacity:
                                  isAtCapacity ||
                                  !inviteEmail[org.id]?.trim() ||
                                  inviteLoading[org.id]
                                    ? 0.5
                                    : 1,
                                cursor:
                                  isAtCapacity ? 'not-allowed' : 'pointer',
                              }}
                              onMouseOver={(e) => {
                                if (!isAtCapacity)
                                  e.currentTarget.style.backgroundColor =
                                    '#333';
                              }}
                              onMouseOut={(e) => {
                                if (!isAtCapacity)
                                  e.currentTarget.style.backgroundColor =
                                    'black';
                              }}
                            >
                              {inviteLoading[org.id] ? 'Sending…' : 'Send Invite'}
                            </button>
                          </div>
                        </div>
                        )}

                        {/* Plan Upgrade */}
                        <div style={{ marginBottom: '16px' }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#555',
                              marginBottom: '8px',
                            }}
                          >
                            Change Plan
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                              value={upgradePlan[org.id] || org.plan}
                              onChange={(e) =>
                                setUpgradePlan((prev) => ({
                                  ...prev,
                                  [org.id]: e.target.value,
                                }))
                              }
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontFamily: FONT_FAMILY,
                              }}
                            >
                              <option value="free">
                                Free (up to {PLAN_LIMITS.free} members)
                              </option>
                              <option value="team">
                                Team (up to {PLAN_LIMITS.team} members)
                              </option>
                              <option value="business">
                                Business (up to {PLAN_LIMITS.business} members)
                              </option>
                            </select>
                            <button
                              onClick={() => handleUpgradePlan(org.id)}
                              disabled={
                                !upgradePlan[org.id] ||
                                upgradePlan[org.id] === org.plan
                              }
                              style={{
                                ...btnSecondary,
                                opacity:
                                  !upgradePlan[org.id] ||
                                  upgradePlan[org.id] === org.plan
                                    ? 0.5
                                    : 1,
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  '#f5f5f5')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'white')
                              }
                            >
                              Update
                            </button>
                          </div>
                        </div>

                        {/* Delete Org */}
                        <div>
                          <button
                            onClick={() => handleDeleteOrg(org.id)}
                            style={btnDanger}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                '#fff5f5')
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor = 'white')
                            }
                          >
                            Delete Organization
                          </button>
                        </div>
                      </>
                    )}

                    {/* Non-admin leave button */}
                    {!isAdmin && (
                      <button
                        onClick={() => handleLeave(org.id)}
                        style={btnDanger}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = '#fff5f5')
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = 'white')
                        }
                      >
                        Leave Organization
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
