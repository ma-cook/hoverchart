import React, { useState, useEffect, useCallback } from 'react';
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
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
import { confirmDialog, notify } from '../../stores/dialogStore';
import './OrganizationManager.css';

const PLAN_LABELS = { free: 'Free', team: 'Team', business: 'Business' };

export const OrganizationManager = React.memo(({ user, show, onClose, onChanged }) => {
  const userId = user?.sub || user?.uid;
  const [orgs, setOrgs] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [orgDetails, setOrgDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createMode, setCreateMode] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('free');
  const [isCreating, setIsCreating] = useState(false);

  const [inviteOpen, setInviteOpen] = useState({});
  const [inviteEmail, setInviteEmail] = useState({});
  const [inviteLoading, setInviteLoading] = useState({});
  const [inviteError, setInviteError] = useState({});
  const [upgradePlan, setUpgradePlan] = useState({});

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [fetchedOrgs, fetchedInvites] = await Promise.allSettled([
        getUserOrganizations(),
        getPendingInvitesForUser(),
      ]);
      if (fetchedOrgs.status === 'fulfilled') {
        setOrgs(fetchedOrgs.value || []);
      }
      if (fetchedInvites.status === 'fulfilled') {
        setPendingInvites(fetchedInvites.value || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadDetails = useCallback(async (orgId) => {
    if (!orgId) return;
    setDetailsLoading(orgId);
    try {
      const org = await getOrganizationById(orgId);
      if (org) {
        setOrgDetails((prev) => ({ ...prev, [orgId]: org }));
      }
    } finally {
      setDetailsLoading((current) => (current === orgId ? null : current));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (show && user) {
      setError('');
      setSuccess('');
      refresh();
    }
  }, [show, user, refresh]);

  useEffect(() => {
    if (!show) return;
    orgs.forEach((org) => loadDetails(org.id));
  }, [show, orgs, loadDetails]);

  if (!show) return null;

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setIsCreating(true);
    setError('');
    setSuccess('');
    try {
      const newOrg = await createOrganization(newOrgName.trim(), newOrgPlan);
      setNewOrgName('');
      setNewOrgPlan('free');
      setCreateMode(false);
      setSuccess('Organization created!');
      setOrgs((prev) => [...prev, newOrg]);
      onChanged?.();
      await refresh();
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
      await inviteUserToOrganization(orgId, email);
      setInviteEmail((prev) => ({ ...prev, [orgId]: '' }));
      setInviteOpen((prev) => ({ ...prev, [orgId]: false }));
      setSuccess('Invite sent!');
      await refreshAll();
      onChanged?.();
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
    const confirmed = await confirmDialog({
      title: 'Remove member',
      message:
        'Remove this member from the organization? They will lose access to organization spaces.',
      confirmLabel: 'Remove member',
      tone: 'danger',
    });
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await removeMemberFromOrganization(orgId, targetUserId);
      await refreshAll();
      onChanged?.();
      notify('Member removed.', { type: 'success', title: 'Member removed' });
    } catch (e) {
      notify(e.message || 'Failed to remove member.', {
        type: 'error',
        title: 'Could not remove member',
      });
    }
  };

  const handleLeave = async (orgId) => {
    const confirmed = await confirmDialog({
      title: 'Leave organization',
      message:
        'You will lose access to this organization and any spaces shared through it. You can only rejoin by invitation.',
      confirmLabel: 'Leave organization',
      tone: 'danger',
    });
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await leaveOrganization(orgId, userId);
      await refresh();
      onChanged?.();
      notify('You have left the organization.', {
        type: 'success',
        title: 'Left organization',
      });
    } catch (e) {
      notify(e.message || 'Failed to leave organization.', {
        type: 'error',
        title: 'Could not leave organization',
      });
    }
  };

  const handleUpgradePlan = async (orgId) => {
    const plan = upgradePlan[orgId];
    if (!plan) return;
    setError('');
    setSuccess('');
    try {
      await updateOrganizationPlan(orgId, plan);
      setUpgradePlan((prev) => ({ ...prev, [orgId]: undefined }));
      setSuccess('Plan updated.');
      await refreshAll();
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to update plan.');
    }
  };

  const handleDeleteOrg = async (orgId) => {
    const confirmed = await confirmDialog({
      title: 'Delete organization',
      message:
        'This organization and its settings will be permanently deleted. Members will lose access. This cannot be undone.',
      confirmLabel: 'Delete organization',
      tone: 'danger',
    });
    if (!confirmed) return;

    setError('');
    setSuccess('');
    try {
      await deleteOrganization(orgId);
      await refresh();
      onChanged?.();
      notify('Organization deleted.', { type: 'success', title: 'Deleted' });
    } catch (e) {
      notify(e.message || 'Failed to delete organization.', {
        type: 'error',
        title: 'Delete failed',
      });
    }
  };

  const handleAcceptInvite = async (orgId) => {
    setError('');
    setSuccess('');
    try {
      await acceptInvite(orgId, userId);
      setSuccess('You have joined the organization!');
      await refresh();
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to accept invite.');
    }
  };

  const handleDeclineInvite = async (orgId) => {
    setError('');
    setSuccess('');
    try {
      await declineInvite(orgId);
      setSuccess('Invite declined.');
      await refresh();
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Failed to decline invite.');
    }
  };

  return (
    <div className="org-manager-overlay">
      <div className="org-manager-card">
        <div className="org-manager-header">
          <h3 className="org-manager-title">Organization</h3>
          <button className="org-manager-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <div className="org-alert org-alert--error">{error}</div>}
        {success && <div className="org-alert org-alert--success">{success}</div>}

        {pendingInvites.length > 0 && (
          <div className="org-section">
            <h4 className="org-section-title">Pending Invites</h4>
            {pendingInvites.map(({ org }) => (
              <div key={org.id} className="org-invite-card">
                <div>
                  <div className="org-invite-name">{org.name}</div>
                  <div className="org-invite-meta">
                    {PLAN_LABELS[org.plan] || org.plan} plan
                  </div>
                </div>
                <div className="org-invite-actions">
                  <button
                    className="org-btn org-btn--primary"
                    onClick={() => handleAcceptInvite(org.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="org-btn org-btn--secondary"
                    onClick={() => handleDeclineInvite(org.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="org-section">
          <div className="org-toolbar">
            {!createMode && orgs.length === 0 && (
              <button
                className="org-btn org-btn--primary"
                onClick={() => {
                  setCreateMode(true);
                  setError('');
                  setSuccess('');
                }}
              >
                + New organization
              </button>
            )}
          </div>

          {createMode && (
            <div className="org-create-form">
              <div className="org-field">
                <label className="org-label" htmlFor="org-name">
                  Organization Name
                </label>
                <input
                  id="org-name"
                  className="org-input"
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div className="org-field">
                <label className="org-label" htmlFor="org-plan">
                  Plan
                </label>
                <select
                  id="org-plan"
                  className="org-select"
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                >
                  <option value="free">Free (up to {PLAN_LIMITS.free} members)</option>
                  <option value="team">Team (up to {PLAN_LIMITS.team} members)</option>
                  <option value="business">Business (up to {PLAN_LIMITS.business} members)</option>
                </select>
              </div>
              <div className="org-actions">
                <button
                  className="org-btn org-btn--primary"
                  onClick={handleCreateOrg}
                  disabled={!newOrgName.trim() || isCreating}
                >
                  {isCreating ? 'Creating…' : 'Create Organization'}
                </button>
                <button
                  className="org-btn org-btn--secondary"
                  onClick={() => {
                    setCreateMode(false);
                    setNewOrgName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!loading && orgs.length === 0 && !createMode && (
            <div className="org-empty">No organizations yet. Create one to get started.</div>
          )}

          {orgs.map((org) => {
            const details = orgDetails[org.id];
            const members = details?.members || [];
            const memberCount =
              details?.members?.length ?? org.memberCount ?? org.member_count ?? 0;
            const memberLimit =
              details?.memberLimit ??
              details?.member_limit ??
              org.memberLimit ??
              org.member_limit ??
              PLAN_LIMITS[org.plan] ??
              3;
            const ownerId =
              org.ownerId || org.owner_id || details?.ownerId || details?.owner_id;
            const isOwner = Boolean(org.isOwner || org.is_owner);
            const isAdmin = Boolean(
              isOwner ||
                org.role === 'admin' ||
                members.some((m) => m.userId === userId && m.role === 'admin')
            );
            const isAtCapacity = memberCount >= memberLimit;
            const isLoadingDetails = detailsLoading === org.id;

            return (
              <div key={org.id} className="org-org-card">
                <div className="org-org-header">
                  <div className="org-org-heading">
                    <span className="org-org-name">{org.name}</span>
                    <span className="org-badge org-badge--plan">
                      {PLAN_LABELS[org.plan] || org.plan}
                    </span>
                    {isAdmin && <span className="org-badge org-badge--admin">Admin</span>}
                  </div>
                </div>

                <div className="org-expanded">
                  {isAtCapacity && (
                    <div className="org-warning">
                      Organization limit reached. Upgrade your plan to add more members.
                    </div>
                  )}

                    <div className="org-control-block">
                      <div className="org-members-header">
                        <span>Members</span>
                        {isAdmin && (
                          <button
                            className="org-btn org-btn--primary org-btn--small"
                            onClick={() =>
                              setInviteOpen((prev) => ({
                                ...prev,
                                [org.id]: !prev[org.id],
                              }))
                            }
                            disabled={isAtCapacity}
                            title={isAtCapacity ? 'Organization at capacity' : 'Invite users'}
                          >
                            Invite users
                          </button>
                        )}
                      </div>

                      <div className="org-member-list">
                        {isLoadingDetails && members.length === 0 ? (
                          <div className="org-empty">Loading members…</div>
                        ) : members.length === 0 ? (
                          <div className="org-empty">No members found.</div>
                        ) : (
                          members.map((member) => {
                            const memberId = member.userId || member.user_id || member.id;
                            const displayName =
                              member.displayName || member.display_name || member.email;
                            return (
                              <div key={memberId} className="org-member-row">
                                <div className="org-member-main">
                                  <span className="org-member-name">{displayName}</span>
                                  {displayName &&
                                    member.email &&
                                    member.email !== displayName && (
                                      <span className="org-member-email">{member.email}</span>
                                    )}
                                  <span
                                    className={`org-member-role ${
                                      member.role === 'admin' ? 'org-member-role--admin' : ''
                                    }`}
                                  >
                                    {member.role}
                                  </span>
                                </div>
                                {isAdmin && memberId !== userId && memberId !== ownerId && (
                                  <button
                                    className="org-btn org-btn--danger org-btn--small"
                                    onClick={() => handleRemoveMember(org.id, memberId)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {isAdmin && inviteOpen[org.id] && (
                      <div className="org-invite-form">
                        <div className="org-control-title">Invite users</div>
                        {inviteError[org.id] && (
                          <div className="org-invite-error">{inviteError[org.id]}</div>
                        )}
                        <div className="org-invite-form-row">
                          <input
                            className="org-input"
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
                          />
                          <button
                            className="org-btn org-btn--primary"
                            onClick={() => handleInvite(org.id)}
                            disabled={
                              isAtCapacity ||
                              !inviteEmail[org.id]?.trim() ||
                              inviteLoading[org.id]
                            }
                          >
                            {inviteLoading[org.id] ? 'Sending…' : 'Send invite'}
                          </button>
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="org-control-block">
                        <div className="org-control-title">Change Plan</div>
                        <div className="org-invite-form-row">
                          <select
                            className="org-select"
                            value={upgradePlan[org.id] || org.plan}
                            onChange={(e) =>
                              setUpgradePlan((prev) => ({
                                ...prev,
                                [org.id]: e.target.value,
                              }))
                            }
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
                            className="org-btn org-btn--secondary"
                            onClick={() => handleUpgradePlan(org.id)}
                            disabled={
                              !upgradePlan[org.id] || upgradePlan[org.id] === org.plan
                            }
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}

                    {isOwner && (
                      <div className="org-actions">
                        <button
                          className="org-btn org-btn--danger"
                          onClick={() => handleDeleteOrg(org.id)}
                        >
                          Delete Organization
                        </button>
                      </div>
                    )}

                    {!isOwner && (
                      <button
                        className="org-btn org-btn--danger"
                        onClick={() => handleLeave(org.id)}
                      >
                        Leave Organization
                      </button>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
