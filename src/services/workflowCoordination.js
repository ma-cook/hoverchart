import useWorkflowStore from '../stores/workflowStore';

/**
 * Builds a workflow context string for injection into the LLM system prompt.
 * Shows other users' active work so the LLM can reason about coordination.
 *
 * @param {string} spaceId - current space
 * @param {string} currentUserId - the user who is prompting (excluded from output)
 * @returns {string} workflow context block, or empty string if no active tickets
 */
export function buildWorkflowContext(spaceId, currentUserId) {
  const { tickets } = useWorkflowStore.getState();
  if (!tickets || tickets.length === 0) return '';

  const activeTickets = tickets.filter(
    (t) => t.spaceId === spaceId && t.userId !== currentUserId && (t.status === 'in_progress' || t.status === 'to_review')
  );

  if (activeTickets.length === 0) return '';

  const lines = ['ACTIVE WORKFLOW IN THIS SPACE — other users are working on:'];

  for (const ticket of activeTickets) {
    const age = formatAge(ticket.createdAt);
    const statusLabel = ticket.status === 'in_progress' ? 'in progress' : 'ready for review';
    const files = (ticket.filesTouched || []).slice(0, 5).join(', ');
    const filesSuffix = (ticket.filesTouched || []).length > 5
      ? ` (+${ticket.filesTouched.length - 5} more)`
      : '';

    lines.push(`  - User "${ticket.userName}" (${statusLabel}, started ${age}):`);
    lines.push(`    Prompt: "${ticket.promptPreview}"`);
    if (files) {
      lines.push(`    Files: ${files}${filesSuffix}`);
    }
  }

  // Detect file overlaps with this prompt (caller can pass in the current
  // prompt's target files for conflict detection — see injectWorkflowContext).
  lines.push('');
  lines.push('If your changes overlap with any of the above files, mention the potential');
  lines.push('conflict in your response so the user can coordinate.');

  return lines.join('\n');
}

/**
 * Inject workflow context into the messages array passed to the LLM.
 * Appends a [WORKFLOW] block to the system message.
 *
 * @param {Array} messages - the messages array (mutated in place)
 * @param {string} spaceId
 * @param {string} currentUserId
 * @returns {Array} the same messages array with workflow context added
 */
export function injectWorkflowContext(messages, spaceId, currentUserId) {
  const ctx = buildWorkflowContext(spaceId, currentUserId);
  if (!ctx || !messages?.length) return messages;

  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg) {
    systemMsg.content += `\n\n${ctx}`;
  }
  return messages;
}

function formatAge(isoString) {
  if (!isoString) return 'recently';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
