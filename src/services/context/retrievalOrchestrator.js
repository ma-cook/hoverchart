import { sendToZen } from '../zenService';
import { stripRetrievalMarkers } from './retrievalProtocol';
import { executeTool, resetEditTracker, refreshRepoWorkingCopies, getAppliedEditRecords } from './toolExecutor';
import { fetchFileContent } from '../githubRepoService';
import { computeTools, computeSubAgentTools } from './toolProvider';
import { initializeDefaultSkills, REGISTRY } from './skillManager';
import { getContentStore } from './contentStore';
import { getBase64Store } from './base64Store';
import { globalMonitor } from './agentMonitor';
import { globalRouter } from './modelRouter';
import { RagPipeline } from './ragPipeline';
import { diffToHunks } from './diffUtils';
import { joinChunks } from './chunkIndex';
import { recordFileRead } from './toolState';

const MAX_UNHELPFUL_ROUNDS = 5;
const MAX_SAME_FILE_READS = 2;
const MAX_CONTEXT_CHARS = 120000;
const MAX_TOOL_RESULT_CHARS = 30000;
const TRUNCATION_WARNING = `\n\n[Output truncated at ${(MAX_TOOL_RESULT_CHARS).toLocaleString()} chars. Use read_file with offset/limit or refine your search to narrow results.]`;
const RETRYABLE_TOOLS = new Set(['read_file', 'edit', 'write', 'search_code']);
const MAX_TOOL_RETRIES = 2;
// Hard cap on a single tool attempt. Tools normally resolve in well under a
// second; a multi-minute stall (IndexedDB contention, Comlink hiccup, event-loop
// starvation) must never leave the whole conversation hanging with no recovery.
// Sub-agents (task) are exempt because they legitimately run long.
const TOOL_HARD_TIMEOUT_MS = 45_000;
const NO_HARD_TIMEOUT_TOOLS = new Set(['task']);
const COMPRESSION_INTERVAL = 8;
// Compression calls the LLM once per summarized pair (each bounded by
// SUMMARIZER_TIMEOUT_MS). Cap the hidden calls per pass so late-game compaction
// degrades to local stubbing instead of multiplying provider round-trips.
const MAX_SUMMARIZER_CALLS_PER_PASS = 2;
// A round that returns no text AND no tool calls is a provider stall, not a
// finish. Retry a bounded number of times (with compaction + a nudge) so a
// context overrun cannot silently end the run with no code produced.
const MAX_EMPTY_COMPLETIONS = 2;
const normalizePath = (p) => (p || '').replace(/^\.\//, '').replace(/\\/g, '/');

// ── Harness hard limits — prevent explore-forever / doom loops ───────────────
const MAX_EXPLORATION_ROUNDS = 24;
const FORCE_GENERATION_AFTER_ROUND = 32;
// Absolute backstop: hard cap on LLM rounds per task. The self-redirect nudges
// below keep legitimate long plans working, but a stuck model (research loop,
// repeated reads, no edits) must never be allowed to consume unbounded provider
// time. On the final round a directive asks for any remaining edits + a summary,
// then the run ends.
const MAX_ROUNDS = 32;
const MAX_SUBAGENT_SPAWNS_PER_TASK = 1;
const SUB_MAX_ROUNDS = 8;
const SUB_MAX_CHARS = 60000;
const SUB_MAX_TOOL_CONTENT = 12000;
const STUCK_EXPLORING_THRESHOLD = 10;
// After the first round-32 nudge, keep re-nudging the model toward generation
// at this cadence instead of ever stripping tools / force-stopping the run.
const GENERATION_NUDGE_INTERVAL = 5;
// Re-synthesize and re-inject the findings digest at this cadence so long plans
// keep receiving digested (not re-compressed noise) context as rounds advance.
const DIGEST_REFRESH_INTERVAL = 8;
// ── Self-redirect + hard round cap ─────────────────────────────────────────
// A user's plan can be arbitrarily large, so the run normally keeps working
// through it. When the agent is locked in a research loop or visibly confused we
// inject a re-orienting nudge — keeping EVERY tool available — that escalates
// each time, so a genuinely stuck run converges to a best-effort partial result
// (via the model ending its own tool calls) rather than looping forever.
// MAX_ROUNDS is the absolute backstop: the run hard-ends there regardless.
const CONFUSION_SIGNAL_THRESHOLD = 3;
const REDIRECT_ESCALATION_AFTER = 2;
const CONFUSION_PATTERNS = /(\bnot sure\b|\bunsure\b|\bunclear\b|\bconfus\w*|\bdo not know\b|don['’]?t know\b|\bcan not find\b|can['’]?t find\b|could not find\b|couldn['’]?t find\b|\bneed more (information|context)\b|\bnot available\b|\bunable to (locate|find|determine)\b|i am (stuck|confused)|i['’]?m (stuck|confused)|\bdo not understand\b|\bdoes not know\b|doesn['’]?t know\b)/i;

/**
 * Fix 1 + Fix 4: Build a "stop exploring, generate now" nudge that gets
 * appended to the messages when the agent has been exploring past
 * MAX_EXPLORATION_ROUNDS without producing any edit/write tool call.
 */
function buildForceGenerationMessage(rounds, exploredCount) {
  return {
    role: 'user',
    content: `⚠️ EXPLORATION LIMIT REACHED (round ${rounds + 1}, ${exploredCount} files read, no edits yet).

You have explored enough. Now produce the code changes. If you need to read a file to get the exact oldString for an edit, you may — but prioritize calling "edit" over further exploration.

Switch to PRODUCING CODE NOW:
  1. Call set_mode("edit") to switch the harness to the editing tool set, then call "edit" with exact oldString/newString for the file you already located.
  2. If an edit fails, correct the oldString (copy exact text from read_file) and retry. NEVER output an entire existing file as a code block — full-file blocks for existing files are rejected and would silently drop the rest of the file.
  3. If you must emit changes as text, use SEARCH/REPLACE blocks covering ONLY the exact changed lines (<<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE), labeled with the file path — never the whole file.`,
  };
}

/**
 * Self-redirect: when the agent is locked in a research loop or visibly
 * confused, re-orient it toward its plan WITHOUT removing any tools. There is
 * no absolute round cap — a user's plan can be arbitrarily large — so each
 * redirect re-focuses the model and escalates: past REDIRECT_ESCALATION_AFTER
 * redirects, it instructs the agent to converge (apply best-effort changes,
 * state what it cannot resolve, and finish by ending its own tool calls) so a
 * genuinely stuck run still ends with a partial result instead of looping.
 */
function buildSelfRedirectMessage({ round, redirectCount, phase, editsSoFar }) {
  const escalated = redirectCount >= REDIRECT_ESCALATION_AFTER;
  const phaseLine = phase === 'confusion'
    ? '⚠️ SIGNAL: Your recent reasoning shows confusion (uncertainty in your text and/or repeated tool failures).'
    : '⚠️ SIGNAL: You appear to be in a research loop — re-reading or re-searching the same material without producing changes.';
  const guidance = escalated
    ? `This is redirect #${redirectCount} with no progress since the last one. STOP re-researching.

1. For any remaining ambiguity, pick the most likely interpretation, note your assumption, and APPLY the change with edit/write.
2. For anything you truly cannot resolve, state it explicitly (file, why, what you tried) and move on to the next change.
3. When everything you can apply has been applied, produce your final response as text with NO further tool calls: summarize what you changed and what remains.`
    : `You still have all your tools — keep using them.

1. Identify your next single concrete step from the user's original request.
2. If you have located all the exact text you need, call set_mode("edit") to switch to the editing tool set, then do that step NOW with edit/write (read_file is only needed to capture an exact oldString).
3. If intent is ambiguous, make a best-effort assumption, state it, and proceed. Ask at most one clarifying question — only after attempting the change.`;
  return {
    role: 'user',
    content: `${phaseLine}

[Round ${round + 1}, redirect #${redirectCount}] Re-focus on the user's original request and continue the plan to completion.

${guidance}

${editsSoFar && editsSoFar.length > 0 ? `Changes already applied this run: ${editsSoFar.join(', ')}. Do not redo or re-read them.` : 'No changes have been applied yet this run.'}`,
  };
}

/**
 * Fix 5: Synthesize a compact digest of the accumulated tool results so the
 * model receives digested context (not re-compressed noise) before being asked
 * to generate. Returns the synthesized summary text, or null on failure.
 */
async function synthesizeFindingsDigest(currentMessages) {
  // Digest the model's OWN accumulated read_file results — the exact content it
  // has already seen — rather than re-reading the content store. This keeps the
  // digest compact and faithful to what is already in context (re-dumping up to
  // 25KB of raw file text only reinforced confusion, and the store may hold
  // stale or re-chunked content). The digest is a memory aid: file + current
  // line range + the lines the model was reading.
  const callPathById = new Map();
  for (const m of currentMessages) {
    if (m.role !== 'assistant' || !m.tool_calls) continue;
    for (const tc of m.tool_calls) {
      if (tc.function?.name !== 'read_file') continue;
      try {
        const args = typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function?.arguments;
        if (args?.path) callPathById.set(tc.id, normalizePath(args.path));
      } catch { /* ignore */ }
    }
  }

  const byPath = new Map(); // path -> { order, content }
  let order = 0;
  for (const m of currentMessages) {
    if (m.role !== 'tool' || typeof m.content !== 'string') continue;
    const path = callPathById.get(m.tool_call_id);
    if (!path) continue;
    // Keep the newest result for each path so repeated reads collapse to one.
    byPath.set(path, { order: order++, content: m.content });
  }

  if (byPath.size === 0) return null;

  const DIGEST_BUDGET = 10000;
  const parts = [];
  let used = 0;
  const sorted = [...byPath.entries()].sort((a, b) => a[1].order - b[1].order);
  for (const [path, { content }] of sorted) {
    if (used >= DIGEST_BUDGET) break;
    const firstLine = content.split('\n')[0] || '';
    const label = `\n=== ${path} ===\n${firstLine}\n`;
    const available = DIGEST_BUDGET - used;
    if (label.length >= available) break;
    const snippet = content.length > available - label.length
      ? content.slice(0, available - label.length) + `\n...[truncated]`
      : content;
    parts.push(label + snippet);
    used += label.length + snippet.length;
  }

  if (parts.length === 0) return null;
  return parts.join('\n');
}

function isTransientError(error) {
  const msg = typeof error === 'string' ? error : (error?.message || error?.content || '');
  if (msg.includes('timeout') || msg.includes('timed out')) return true;
  if (msg.includes('ECONNREFUSED') || msg.includes('ECONNRESET')) return true;
  if (msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND')) return true;
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
  if (msg.includes('rate limit') || msg.includes('too many requests')) return true;
  return false;
}

function estimateMessagesSize(msgs) {
  let total = 0;
  for (const m of msgs) {
    total += (m.content || '').length;
    if (m.tool_calls) {
      for (const tc of m.tool_calls) {
        total += (tc.function?.arguments || '').length;
      }
    }
  }
  return total;
}

async function compressMessages(msgs, { summarizerFn, forceHard = false } = {}) {
  if (msgs.length <= 2) return msgs;

  const systemMsg = msgs[0];
  const userMsg = msgs[1];
  const rest = [...msgs.slice(2)];

  const lastReadByPath = new Map();
  // B: record the window (start/end + message index) of every read_file call so
  // stale read results are only stubbed when a LATER read actually covers the
  // same region — a later read of a different region must not erase this
  // content (it is the only source of that region).
  const readWindowsByPath = new Map();
  // Files the model has attempted to edit/write — their reads must stay exact
  // so the edit tool can land oldString without lossy compression.
  const editTargetPaths = new Set();
  for (let i = 0; i < rest.length; i++) {
    const msg = rest[i];
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function?.name === 'read_file') {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args.path) {
              lastReadByPath.set(args.path, i);
              const start = Math.max(1, parseInt(args.offset, 10) || 1);
              const end = start + Math.min(parseInt(args.limit, 10) || 8000, 10000) - 1;
              const list = readWindowsByPath.get(args.path);
              if (list) list.push({ i, start, end });
              else readWindowsByPath.set(args.path, [{ i, start, end }]);
            }
          } catch { /* ignore */ }
        }
        if (tc.function?.name === 'edit' || tc.function?.name === 'write') {
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            if (args?.filePath) editTargetPaths.add(normalizePath(args.filePath));
          } catch { /* ignore */ }
        }
      }
    }
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  const SEARCH_TOOLS = new Set(['search_code', 'search_nodes', 'get_node_info', 'file_outline', 'quick_look']);
  let compressedCount = 0;
  for (let i = 0; i < rest.length; i++) {
    const msg = rest[i];
    if (msg.role !== 'tool' || typeof msg.content !== 'string') continue;
    if (msg.content.length < 500) continue;

    const prev = i > 0 ? rest[i - 1] : null;
    if (prev?.role !== 'assistant' || !prev?.tool_calls) continue;

    const tc = prev.tool_calls.find(t => t.id === msg.tool_call_id);
    if (!tc) continue;

    if (tc.function?.name === 'read_file') {
      try {
        const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
        if (args.path && lastReadByPath.get(args.path) > i && !editTargetPaths.has(normalizePath(args.path))) {
          // B: only stub when a LATER read of the same path covers >= 80% of
          // this window. If a later read hit a different region, this result is
          // the only source of that content — stubbing it erases real context
          // and forces a genuine re-read (which then looks like a stall).
          const start = Math.max(1, parseInt(args.offset, 10) || 1);
          const end = start + Math.min(parseInt(args.limit, 10) || 8000, 10000) - 1;
          const reqLen = end - start + 1;
          const laterWindows = (readWindowsByPath.get(args.path) || []).filter(w => w.i > i);
          const covered = laterWindows.some(w => {
            const overlap = Math.max(0, Math.min(end, w.end) - Math.max(start, w.start) + 1);
            return overlap / reqLen >= 0.8;
          });
          if (covered) {
            msg.content = `[Previously read: ${args.path} — ${msg.content.length} chars — see the later read_file above]`;
            compressedCount++;
          }
        }
      } catch { /* ignore */ }
    } else if (tc.function?.name === 'edit' && msg.content.length > 8000) {
      // Edit results carry the exact post-edit context block (lines around the
      // change) that subsequent edits need to keep their oldString in sync.
      // Only truncate genuinely huge responses; keep normal edit results intact
      // so the model never has to re-read a file right after editing it.
      const hasSubsequent = rest.slice(i + 1).some(m => m.role === 'assistant');
      if (hasSubsequent) {
        const firstLine = msg.content.split('\n')[0] || '';
        msg.content = `[Edit applied — ${firstLine}]`;
        compressedCount++;
      }
    } else if (SEARCH_TOOLS.has(tc.function?.name)) {
      const hasSubsequent = rest.slice(i + 1).some(m => m.role === 'assistant');
      if (hasSubsequent) {
        const lines = msg.content.split('\n').filter(l => l.trim());
        const fileMatches = [];
        for (const line of lines) {
          const pathMatch = line.match(/^([^\s:]+\.[a-z]{1,4})[:\s]/i);
          if (pathMatch && !fileMatches.includes(pathMatch[1])) fileMatches.push(pathMatch[1]);
        }
        const summary = fileMatches.length > 0
          ? `[Search results — ${lines.length} matches in: ${fileMatches.slice(0, 5).join(', ')}${fileMatches.length > 5 ? ` +${fileMatches.length - 5} more` : ''}]`
          : `[Search results — ${lines.length} lines]`;
        msg.content = summary;
        compressedCount++;
      }
    }
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
  }

  if (compressedCount > 0) {
    console.log(`[Compression] Compressed ${compressedCount} stale tool results`);
  }

  let result = [systemMsg, userMsg, ...rest];
  const totalSize = estimateMessagesSize(result);
  if (totalSize > MAX_CONTEXT_CHARS * 0.6 && rest.length > 10) {
    const pairs = [];
    for (let i = 0; i < rest.length; i++) {
      const msg = rest[i];
      if (msg.role === 'assistant' && msg.tool_calls) {
        const toolResults = [];
        let j = i + 1;
        while (j < rest.length && rest[j].role === 'tool') {
          toolResults.push(rest[j]);
          j++;
        }
        pairs.push({ assistant: msg, tools: toolResults, endIdx: j - 1 });
        i = j - 1;
      }
    }
    let dropped = 0;
    let summarized = 0;
    const keepIndices = new Set(rest.map((_, i) => i));
    const keepLast = Math.max(5, Math.floor(pairs.length * 0.5));
    for (let p = 0; p < pairs.length - keepLast; p++) {
      const pair = pairs[p];
      const hasToolCalls = pair.assistant.tool_calls?.some(tc => tc.function?.name === 'edit' || tc.function?.name === 'write' || tc.function?.name === 'read_file' || tc.function?.name === 'search_code');
      if (!hasToolCalls && (!pair.assistant.content || pair.assistant.content.length < 50)) {
        keepIndices.delete(pair.endIdx);
        for (let k = pair.endIdx - 1; k >= 0 && rest[k] !== pair.assistant; k--) {
          keepIndices.delete(k);
        }
        const idx = rest.indexOf(pair.assistant);
        if (idx >= 0) keepIndices.delete(idx);
        dropped++;
      }
    }
    if (summarizerFn) {
      let summarizeCalls = 0;
      for (let p = 0; p < pairs.length - keepLast; p++) {
        const pair = pairs[p];
        const asstIdx = rest.indexOf(pair.assistant);
        if (!keepIndices.has(asstIdx)) continue;
        const hasToolCalls = pair.assistant.tool_calls?.some(tc => tc.function?.name === 'edit' || tc.function?.name === 'write' || tc.function?.name === 'read_file' || tc.function?.name === 'search_code');
        // Never summarize pairs that touched a file the model intends to edit —
        // the exact read content and edit result are needed for subsequent edits.
        const pairHitsEditTarget = (pair.assistant.tool_calls || []).some(tc => {
          if (tc.function?.name !== 'read_file' && tc.function?.name !== 'edit' && tc.function?.name !== 'write') return false;
          try {
            const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
            const path = args?.path || args?.filePath;
            return !!path && editTargetPaths.has(normalizePath(path));
          } catch { return false; }
        });
        if (hasToolCalls && !pairHitsEditTarget && pair.tools.length > 0 && pair.assistant.content?.length < 100) {
          if (summarizeCalls >= MAX_SUMMARIZER_CALLS_PER_PASS) break;
          const summary = await summarizerFn(pair.assistant, pair.tools);
          summarizeCalls++;
          if (summary) {
            pair.assistant.content = `[Previously: ${summary}]`;
            pair.assistant.tool_calls = undefined;
            for (const tool of pair.tools) {
              const tIdx = rest.indexOf(tool);
              if (tIdx >= 0) keepIndices.delete(tIdx);
            }
            summarized++;
          }
        }
      }
    }
    if (dropped > 0 || summarized > 0) {
      const filtered = rest.filter((_, i) => keepIndices.has(i));
      console.log(`[Compression] Dropped ${dropped} silent pairs, summarized ${summarized} old pairs`);
      result = [systemMsg, userMsg, ...filtered];
    }
  }

  // Aggressive budget-driven compaction: used only when a normal pass could not
  // bring the context under the harness cap. Walks the OLDEST pairs forward,
  // keeping the most recent rounds and anything tied to an edit target intact,
  // and summarizes / stubs / drops the rest until we fit under MAX_CONTEXT_CHARS.
  if (forceHard && estimateMessagesSize(result) > MAX_CONTEXT_CHARS) {
    const working = [...result];
    const pairs = [];
    for (let i = 0; i < working.length; i++) {
      const msg = working[i];
      if (msg.role === 'assistant' && msg.tool_calls) {
        const tools = [];
        let j = i + 1;
        while (j < working.length && working[j].role === 'tool') {
          tools.push(working[j]);
          j++;
        }
        pairs.push({ assistant: msg, tools, endIdx: j - 1 });
        i = j - 1;
      }
    }
    const measure = () => estimateMessagesSize(working.filter(Boolean));
    let hardSkipped = 0;
    let hardSummarizeCalls = 0;
    const HARD_KEEP_LAST = 2;
    for (let p = 0; p < pairs.length - HARD_KEEP_LAST; p++) {
      const pair = pairs[p];
      if (measure() <= MAX_CONTEXT_CHARS) break;
      const pairHitsEditTarget = (pair.assistant.tool_calls || []).some(tc => {
        if (tc.function?.name !== 'read_file' && tc.function?.name !== 'edit' && tc.function?.name !== 'write') return false;
        try {
          const args = typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          const path = args?.path || args?.filePath;
          return !!path && editTargetPaths.has(normalizePath(path));
        } catch { return false; }
      });
      if (pairHitsEditTarget) {
        hardSkipped++;
        continue;
      }
      const asstIdx = working.indexOf(pair.assistant);
      if (asstIdx < 0) continue;
      let replaced = false;
      if (summarizerFn && hardSummarizeCalls < MAX_SUMMARIZER_CALLS_PER_PASS) {
        const summary = await summarizerFn(pair.assistant, pair.tools);
        if (summary) {
          hardSummarizeCalls++;
          working[asstIdx].content = `[Previously: ${summary}]`;
          working[asstIdx].tool_calls = undefined;
          for (const tool of pair.tools) {
            const tIdx = working.indexOf(tool);
            if (tIdx >= 0) working[tIdx] = null;
          }
          replaced = true;
        }
      }
      if (!replaced) {
        for (const tool of pair.tools) {
          const tIdx = working.indexOf(tool);
          if (tIdx < 0 || typeof working[tIdx]?.content !== 'string') continue;
          const name = (pair.assistant.tool_calls || []).find(t => t.id === tool.tool_call_id)?.function?.name || '';
          const firstLine = working[tIdx].content.split('\n')[0] || '';
          if (name === 'read_file') {
            working[tIdx].content = `[Previously read: ${working[tIdx].content.length} chars — captured in EXPLORATION DIGEST]`;
          } else if (SEARCH_TOOLS.has(name)) {
            working[tIdx].content = `[Search results — ${working[tIdx].content.split('\n').length} lines]`;
          } else if (name === 'edit' || name === 'write') {
            working[tIdx].content = `[Edit applied — ${firstLine}]`;
          } else {
            working[tIdx].content = `[Tool result — ${working[tIdx].content.length} chars]`;
          }
        }
        const hasEditOrWrite = (pair.assistant.tool_calls || []).some(t => t.function?.name === 'edit' || t.function?.name === 'write');
        if (!hasEditOrWrite && (!pair.assistant.content || pair.assistant.content.length < 100)) {
          working[asstIdx] = null;
          for (const tool of pair.tools) {
            const tIdx = working.indexOf(tool);
            if (tIdx >= 0) working[tIdx] = null;
          }
        }
      }
      if (p % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }
    const compacted = working.filter(Boolean);
    if (compacted.length !== result.length) {
      console.log(`[Compression] Hard compaction: summarized/stubbed ${result.length - compacted.length} items (skipped ${hardSkipped} edit-target pairs)`);
      result = compacted;
    }
  }

  return result;
}

function generateSearchReplacePatch(original, modified, filePath) {
  if (!original || !modified || original === modified) return null;
  const hunks = diffToHunks(original, modified);
  if (hunks.length === 0) return null;
  const origLines = original.split('\n');
  const blocks = hunks.map(h => {
    const idx = original.indexOf(h.oldString);
    let contextBefore = '';
    let contextAfter = '';
    if (idx !== -1) {
      const lineBefore = original.slice(0, idx).split('\n').length;
      contextBefore = lineBefore > 1 ? origLines[lineBefore - 2] : '';
      const lineAfter = lineBefore - 1 + h.oldString.split('\n').length;
      contextAfter = lineAfter < origLines.length ? origLines[lineAfter] : '';
    }
    return {
      search: h.oldString,
      replace: h.newString,
      contextBefore,
      contextAfter,
    };
  });
  const ext = filePath.split('.').pop() || 'txt';
  const patchParts = blocks.map(b => {
    const lines = [];
    if (b.contextBefore) lines.push(` ${b.contextBefore}`);
    lines.push(`<<<<<<< SEARCH`);
    lines.push(b.search);
    lines.push(`=======`);
    lines.push(b.replace);
    lines.push(`>>>>>>> REPLACE`);
    if (b.contextAfter) lines.push(` ${b.contextAfter}`);
    return lines.join('\n');
  });
  return `\`\`\`${ext}:${filePath}\n${patchParts.join('\n\n')}\n\`\`\``;
}

// The model sometimes echoes a SEARCH/REPLACE block for a file back into its
// final text AFTER the edit tool already applied the change. Those blocks often
// use POST-edit content as the SEARCH side, so they cannot match the pre-edit
// repo snapshot and would make applySearchReplace fail (leaving raw markers as
// the proposed file). Remove any fenced block labeled `:${filePath}` so the
// harness's canonical synthesized patch is the only block for the file.
function stripModelCodeBlockForFile(text, filePath) {
  if (!text) return text;
  const escaped = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('```[a-zA-Z0-9_+#.-]*:' + escaped + '\\n[\\s\\S]*?```', 'g');
  return text.replace(re, '').replace(/\n{3,}/g, '\n\n').trim();
}

const FAILURE_PATTERNS = /^Error:|^File not found:|^No (matching|files) found|^Unknown tool|^search_code requires/i;

function isUsefulToolResult(content, toolName) {
  if (!content) return false;
  if (FAILURE_PATTERNS.test(content.trim())) return false;
  if (toolName === 'search_code' && content.trim().split('\n').length < 1) return false;
  return true;
}

function readKey(tc) {
  if (tc.name === 'read_file') {
    return `read_file:${tc.arguments.path}:${tc.arguments.offset || 1}:${tc.arguments.limit || 8000}`;
  }
  return `${tc.name}:${JSON.stringify(tc.arguments)}`;
}

export function buildCodeGenPipeline({ sendToLLM, executeToolCall, compressMessages, estimateSize }) {
  const pipeline = new RagPipeline();

  pipeline.use(RagPipeline.createRouterStage(async (ctx) => {
    const taskType = globalRouter.classifyTaskType(ctx.messages, ctx.tools);
    const route = await globalRouter.route(taskType, {
      providerId: ctx.providerId,
      model: ctx.model,
      messages: ctx.messages,
    });
    return { taskType, route };
  }));

  pipeline.use({
    name: 'send',
    execute: async (ctx) => {
      const raw = await sendToLLM(ctx.messages, ctx.tools, ctx.signal);
      const result = typeof raw === 'string' ? { text: raw, toolCalls: [] } : raw;
      return { rawResult: result, text: result.text, toolCalls: result.toolCalls || [] };
    },
  });

  pipeline.use(RagPipeline.createStopIf(async (ctx) => {
    return !ctx.toolCalls || ctx.toolCalls.length === 0;
  }));

  pipeline.use({
    name: 'compress-check',
    execute: async (ctx) => {
      if (estimateSize(ctx.messages) > MAX_CONTEXT_CHARS) {
        ctx.messages = await compressMessages(ctx.messages);
      }
      return { messages: ctx.messages };
    },
  });

  pipeline.use({
    name: 'execute-tools',
    execute: async (ctx) => {
      const promises = ctx.toolCalls.map(tc => executeToolCall(tc));
      const results = await Promise.all(promises);
      const usefulCount = results.filter(r => isUsefulToolResult(r.result.content, r.tc.name)).length;
      return { toolResults: results, usefulCount, uselessCount: results.length - usefulCount };
    },
  });

  return pipeline;
}

function withToolTimeout(tc, execFn) {
  if (NO_HARD_TIMEOUT_TOOLS.has(tc.name)) return execFn();
  let timer;
  return Promise.race([
    execFn(),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${tc.name} tool timed out after ${TOOL_HARD_TIMEOUT_MS / 1000}s — the tool execution hung and was aborted`)), TOOL_HARD_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function executeWithRetry(tc, execFn) {
  for (let attempt = 0; attempt <= MAX_TOOL_RETRIES; attempt++) {
    try {
      const result = await withToolTimeout(tc, execFn);
      if (!result.success && isTransientError(result.content) && attempt < MAX_TOOL_RETRIES && RETRYABLE_TOOLS.has(tc.name)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[Retry] ${tc.name} attempt ${attempt + 1}/${MAX_TOOL_RETRIES + 1}: ${result.content?.slice(0, 80)}... Retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return result;
    } catch (error) {
      if (attempt < MAX_TOOL_RETRIES && RETRYABLE_TOOLS.has(tc.name) && isTransientError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[Retry] ${tc.name} attempt ${attempt + 1}/${MAX_TOOL_RETRIES + 1} threw: ${error.message}. Retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

export async function sendWithRetrieval({
  messages,
  onChunk,
  signal,
  onRetrieval,
  onToolProgress,
  githubContext,
  fileTree,
  _fileSizes,
  sceneObjects,
}) {
  let currentMessages = [...messages];
  let finalText = '';
  let rounds = 0;
  let consecutiveUnhelpfulRounds = 0;
  const readFiles = new Map();
  let duplicateReadRounds = 0;
  const editedFilePaths = new Set();
  const originalFileContents = new Map();
  const preEditBaselines = new Map();
  let lastCompressionRound = -COMPRESSION_INTERVAL;
  // R2: overlap-aware read tracking. fileReadRanges records every read_file
  // window (start/end lines + round) per normalized path so repeated reads of
  // the same content — even with slightly different offsets — are detected.
  // fileLastEditRound stamps when a file was last edited so a re-read AFTER an
  // edit is never mis-flagged as a duplicate (line numbers legitimately shift).
  const fileReadRanges = new Map();
  const fileLastEditRound = new Map();
  // C2: per-file count of duplicate-read rounds and the last round a targeted
  // read-stall nudge was injected, to avoid spamming the same file.
  const readStallNudgeRound = new Map();

  // Fix 2: track sub-agent spawns per task to enforce hard cap and dedupe prompts.
  const subAgentSpawnCount = { value: 0 };
  const subAgentPrompts = new Set();

  // Fix 1 / Fix 4: track whether the agent has produced any edit/write this run.
  let producedEdit = false;
  let forceGenerationInjected = false;
  let lastDigestRound = -1;
  let lastGenerationNudgeRound = -1;
  // Self-redirect tracking: how many re-orienting nudges have been issued, when
  // the last one was, and a running count of confusion signals (uncertainty
  // phrasing in the model's text, or retryable tool failures).
  let redirectCount = 0;
  let lastRedirectRound = -1;
  let consecutiveConfusionSignals = 0;
  // Research/edit mode: the model drives this via set_mode(); the first
  // successful edit/write auto-flips research → edit so search tools drop off
  // until the model calls set_mode("research").
  let currentMode = 'research';
  let autoFlippedToEdit = false;
  // Fix 2 (enforced): once the agent is clearly stuck in research (repeated
  // read-stall nudges, a prior self-redirect, or exploration past the threshold)
  // with no edits, the harness stops advising and forces EDIT mode — stripping
  // search/list/graph tools from the next round so the model must edit or finish.
  let forcedEditMode = false;
  // Bounded retries when a round returns neither text nor tool calls.
  let emptyCompletions = 0;
  // Names of tools actually sent to the model this round. Used by the
  // execution-time gate to block hallucinated calls to tools that are not in
  // the round's tool list.
  let currentToolNames = new Set();

  resetEditTracker();
  initializeDefaultSkills({
    fileTree,
    fileSizes: _fileSizes,
    sceneObjects,
  });

  // F1: re-anchor the working copy to GitHub HEAD before the run starts. The
  // content store persists in IndexedDB across sessions, so without a refresh
  // the model can end up editing a stale or previously-corrupted copy (bad
  // fuzzy edits from older harness versions survive a reload). Refreshing every
  // repo entry makes read/edit/write and the final synthetic diffs reflect the
  // true GitHub baseline. Failures keep existing entries and are non-fatal.
  if (githubContext?.owner && githubContext?.repo) {
    try {
      const refreshed = await refreshRepoWorkingCopies({ githubContext });
      for (const [p, c] of refreshed) originalFileContents.set(p, c);
    } catch (err) {
      console.warn(`[ToolRound] F1 refresh failed (continuing with stored copies):`, err.message);
    }
  }

  // Pre-activate architecture context so the model has the graph/community
  // tools and their instructions ready from round 1 — no list_skills /
  // activate_skill discovery rounds needed.
  for (const skillName of ['architecture-map', 'import-analysis', 'community-architecture']) {
    REGISTRY.activate(skillName);
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const taskType = globalRouter.classifyTaskType(messages, computeTools());
  console.log(`[sendWithRetrieval] Classified task type: ${taskType}`);

  const mainInvocation = globalMonitor.startInvocation({
    agentName: 'sendWithRetrieval',
    inputs: { messageCount: messages.length, fileTreeSize: fileTree?.length },
  });

  const summarizeOldRound = async (assistantMsg, toolMsgs) => {
    const toolSnippets = toolMsgs.map(t => (t.content || '').slice(0, 800)).join('\n---\n');
    const prompt = `Summarize what the assistant learned or accomplished in 1 sentence (max 50 words):\n\nAssistant: ${(assistantMsg.content || '(no text)').slice(0, 300)}\n\nTool results:\n${toolSnippets.slice(0, 2500)}`;
    try {
      // Bound the hidden summarizer call so a stalled provider can't freeze the
      // whole tool round — compression should degrade gracefully, not hang.
      const SUMMARIZER_TIMEOUT_MS = 8_000;
      let timer;
      const result = await Promise.race([
        sendToZen({
          messages: [
            { role: 'system', content: 'You summarize concisely. Return only the summary, no prefixes.' },
            { role: 'user', content: prompt },
          ],
          tools: [],
          signal: null,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('summary timed out after 25s')), SUMMARIZER_TIMEOUT_MS);
        }),
      ]).finally(() => clearTimeout(timer));
      const summary = (typeof result === 'string' ? result : result?.text || '').trim().slice(0, 400);
      return summary || null;
    } catch { return null; }
  };

  while (true) {
    if (rounds >= MAX_ROUNDS) {
      console.warn(`[ToolRound] Hard cap (${MAX_ROUNDS} rounds) reached — ending run`);
      break;
    }
    // Fix 1: final-round directive so the cap never truncates a run mid-edit —
    // the last allowed round is told to finish any remaining edits + summarize.
    const isFinalRound = rounds >= MAX_ROUNDS - 1;
    if (isFinalRound) {
      currentMessages = [...currentMessages, {
        role: 'user',
        content: `[Harness: ${MAX_ROUNDS}-round budget exhausted — this is the final round. Produce any remaining changes NOW with edit/write using exact oldString from the content above, then respond with a concise summary of what you changed (and what remains, if anything). Do not call more tools after applying your final change.]`,
      }];
    }
    const currentSize = estimateMessagesSize(currentMessages);
    if (currentSize > MAX_CONTEXT_CHARS || (currentSize > MAX_CONTEXT_CHARS * 0.6 && (rounds - lastCompressionRound) >= COMPRESSION_INTERVAL)) {
      lastCompressionRound = rounds;
      currentMessages = await compressMessages(currentMessages, { summarizerFn: summarizeOldRound });
      // Never send a context over the harness cap: if the normal pass could not
      // bring it under, run the aggressive budget-driven compaction.
      if (estimateMessagesSize(currentMessages) > MAX_CONTEXT_CHARS) {
        currentMessages = await compressMessages(currentMessages, { summarizerFn: summarizeOldRound, forceHard: true });
        console.warn(`[ToolRound] Hard compaction: ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);
      }
      console.log(`[ToolRound] Compressed to ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);
    }

    // ── Fix 1: gentle nudge from exploration → generation ───────────────────
    // When the agent has been exploring past the cap without edits, append a
    // nudge message asking it to switch to producing changes. Unlike the old
    // behavior, the system prompt is NOT replaced and NO tools are stripped —
    // the model keeps read_file/search_code so it can still pull exact text
    // for edit oldString and verify its changes. The nudge is advisory only.
    if (
      !producedEdit &&
      !forceGenerationInjected &&
      rounds >= MAX_EXPLORATION_ROUNDS &&
      rounds < FORCE_GENERATION_AFTER_ROUND
    ) {
      forceGenerationInjected = true;
      const forceMsg = buildForceGenerationMessage(rounds, readFiles.size);
      currentMessages = [...currentMessages, forceMsg];
      console.warn(`[ToolRound] Fix 1: nudged into generation at round ${rounds + 1} — all tools remain available`);
    }

    // ── Fix 5: synthesize a digest so the model gets digested context ─────
    // Hand the model a terse digest of what exploration found (file:line targets
    // to edit) so it has the synthesis it needs rather than re-reading compressed
    // noise. Re-injected every DIGEST_REFRESH_INTERVAL rounds (not just once) so
    // long plans keep receiving fresh digested context.
    if (
      !producedEdit &&
      rounds >= STUCK_EXPLORING_THRESHOLD &&
      rounds < FORCE_GENERATION_AFTER_ROUND &&
      rounds - lastDigestRound >= DIGEST_REFRESH_INTERVAL
    ) {
      lastDigestRound = rounds;
      try {
        const digest = await synthesizeFindingsDigest(currentMessages, originalFileContents, getContentStore, getBase64Store);
        if (digest) {
          currentMessages = [...currentMessages, {
            role: 'user',
            content: `📋 EXPLORATION DIGEST (synthesized from prior tool calls):\n\n${digest}\n\nUse this digest to locate your edit targets. To craft an exact edit oldString, re-read only the narrow slice around the target line; do not re-read whole files. When your edit targets are clear, call set_mode("edit") to switch to the editing tool set.`,
          }];
          console.warn(`[ToolRound] Fix 5: injected findings digest at round ${rounds + 1} (${digest.length} chars)`);
        }
      } catch (e) {
        console.warn(`[ToolRound] Fix 5: digest synthesis failed: ${e.message}`);
      }
    }

    // ── Fix 4 (reworked): sustained generation nudge, no hard stop ──────────
    // The original Fix 4 stripped ALL tools at FORCE_GENERATION_AFTER_ROUND and
    // demanded a forced final narrative response. That cut off legitimate long
    // plans mid-execution and frequently produced narrative text instead of code
    // blocks. Now the run never force-exits: past round 32 we keep every tool
    // available and re-nudge at GENERATION_NUDGE_INTERVAL, re-injecting a
    // refreshed findings digest so the model keeps working the plan to
    // completion. Research loops and confusion are handled separately by the
    // self-redirect block at the end of each round (never by breaking).
    if (
      !producedEdit &&
      rounds >= FORCE_GENERATION_AFTER_ROUND &&
      rounds - lastGenerationNudgeRound >= GENERATION_NUDGE_INTERVAL
    ) {
      lastGenerationNudgeRound = rounds;
      console.warn(`[ToolRound] Fix 4: sustained nudge at round ${rounds + 1} (>= ${FORCE_GENERATION_AFTER_ROUND}, 0 edits) — all tools remain available`);
      const forceMsg = buildForceGenerationMessage(rounds, readFiles.size);
      currentMessages = [...currentMessages, forceMsg];
      if (rounds - lastDigestRound >= DIGEST_REFRESH_INTERVAL) {
        lastDigestRound = rounds;
        try {
          const digest = await synthesizeFindingsDigest(currentMessages, originalFileContents, getContentStore, getBase64Store);
          if (digest) {
            currentMessages = [...currentMessages, {
              role: 'user',
              content: `📋 REFRESHED EXPLORATION DIGEST (round ${rounds + 1}):\n\n${digest}\n\nApply the changes now — if you are not already, call set_mode("edit") to switch to the editing tool set. To craft an exact edit oldString, re-read only the narrow slice around the target line; do not re-read whole files.`,
            }];
            console.warn(`[ToolRound] Fix 4: injected refreshed digest at round ${rounds + 1} (${digest.length} chars)`);
          }
        } catch (e) {
          console.warn(`[ToolRound] Fix 4: digest refresh failed: ${e.message}`);
        }
      }
    }

    const roundInvocation = globalMonitor.startInvocation({
      agentName: `round-${rounds + 1}`,
      inputs: { messageCount: currentMessages.length, charSize: estimateMessagesSize(currentMessages) },
      iteration: rounds,
    });

    console.log(`[ToolRound] Round ${rounds + 1} - sending ${currentMessages.length} messages (${estimateMessagesSize(currentMessages)} chars)`);

    const MAX_SEND_RETRIES = 2;
    let rawResult = null;
    let sendFailed = false;
    for (let sendAttempt = 0; sendAttempt <= MAX_SEND_RETRIES; sendAttempt++) {
      try {
        const availableTools = computeTools({ mode: currentMode });
        currentToolNames = new Set(availableTools.map(t => t.function.name));
        rawResult = await sendToZen({
          messages: currentMessages,
          tools: availableTools,
          signal,
          onChunk: (delta, fullText) => {
            const displayedText = finalText ? finalText + '\n\n' + fullText : fullText;
            onChunk?.(delta, stripRetrievalMarkers(displayedText));
          },
        });
        break;
      } catch (sendErr) {
        console.warn(`[ToolRound] Round ${rounds + 1} sendToZen failed (${sendAttempt + 1}/${MAX_SEND_RETRIES + 1}): ${sendErr.message}`);
        if (sendAttempt < MAX_SEND_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (sendAttempt + 1)));
        } else {
          sendFailed = true;
        }
      }
    }
    if (sendFailed) {
      console.warn(`[ToolRound] Round ${rounds + 1}: all send attempts failed, breaking loop`);
      break;
    }

    const result = typeof rawResult === 'string' ? { text: rawResult, toolCalls: [] } : rawResult;
    const { text, toolCalls } = result;
    if (text) {
      finalText = finalText ? finalText + '\n\n' + text : text;
    }
    console.log(`[ToolRound] Round ${rounds + 1} complete. Text: ${(text || '').length} chars (total: ${finalText.length}), Tool calls: ${toolCalls.length}`);

    if (toolCalls.length === 0) {
      if (!text) {
        emptyCompletions++;
        if (emptyCompletions > MAX_EMPTY_COMPLETIONS) {
          console.warn(`[ToolRound] ${emptyCompletions} consecutive empty completions — ending run`);
          break;
        }
        // An empty completion is a provider stall, not a finish. Compact if the
        // context is large, then re-nudge and retry so a context overrun cannot
        // silently end the run with no code while there is still work to do.
        console.warn(`[ToolRound] Empty completion (${emptyCompletions}/${MAX_EMPTY_COMPLETIONS}) — compacting and re-nudging`);
        if (estimateMessagesSize(currentMessages) > MAX_CONTEXT_CHARS * 0.6) {
          currentMessages = await compressMessages(currentMessages, { summarizerFn: summarizeOldRound, forceHard: true });
        }
        currentMessages = [...currentMessages, {
          role: 'user',
          content: `[The model returned no text and no tool calls. Continue the task: apply the next change with edit/write, or if you are truly finished, respond with a summary of what you changed and what remains.]`,
        }];
        rounds++;
        continue;
      }
      break;
    }

    const roundKeys = toolCalls.map(tc => readKey(tc));
    const dupCounts = new Map();
    for (const key of roundKeys) {
      dupCounts.set(key, (dupCounts.get(key) || 0) + 1);
    }
    let doomLoopDetected = false;
    for (const [key, count] of dupCounts) {
      if (count >= 4) {
        console.warn(`[ToolRound] Doom loop detected: tool called ${count} times with identical args in one round`);
        doomLoopDetected = true;
      }
    }
    if (doomLoopDetected) {
      // Not a break: mark it so the self-redirect block re-orients the agent
      // this round while keeping every tool available.
      console.warn(`[ToolRound] Doom loop flagged — will self-redirect at end of round`);
    }

    onRetrieval?.({ chunkIds: toolCalls.map(tc => tc.name + ':' + JSON.stringify(tc.arguments)), round: rounds + 1 });

    const assistantMessage = { role: 'assistant', content: text || null, tool_calls: toolCalls.map(tc => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
    }))};

    currentMessages = [...currentMessages, assistantMessage];

    const totalTools = toolCalls.length;
    onToolProgress?.({ tool: 'starting', index: 0, total: totalTools, status: 'executing' });

    const runSubAgent = async ({ prompt, tools, systemPrompt, githubContext: ghCtx, fileTree: ft, depth: subDepth }) => {
      // Fix 2: enforce a hard cap on sub-agent spawns per task.
      if (subAgentSpawnCount.value >= MAX_SUBAGENT_SPAWNS_PER_TASK) {
        console.warn(`[SubAgent] Spawn rejected: cap reached (${MAX_SUBAGENT_SPAWNS_PER_TASK} per task). Returning short refusal.`);
        return `[Sub-agent unavailable: spawn cap of ${MAX_SUBAGENT_SPAWNS_PER_TASK} reached for this task. Use the main thread's existing tools/edit instead.]`;
      }
      // Fix 2: deduplicate near-identical prompts (ignore whitespace differences).
      const promptKey = (prompt || '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 200);
      if (subAgentPrompts.has(promptKey)) {
        console.warn(`[SubAgent] Spawn rejected: duplicate prompt ("${promptKey.slice(0, 60)}..."). Returning refusal.`);
        return `[Sub-agent not spawned: an identical sub-agent was already used this task. Re-use its results or do the research directly with read_file/search_code.]`;
      }
      subAgentPrompts.add(promptKey);
      subAgentSpawnCount.value++;

      const subInvocation = globalMonitor.startInvocation({
        agentName: 'sub-agent',
        inputs: { prompt: prompt.slice(0, 200), depth: subDepth },
      });
      const subMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ];
      let subText = '';
      // Fix 3: constants now declared at module scope (SUB_MAX_ROUNDS, SUB_MAX_CHARS,
      //        SUB_MAX_TOOL_CONTENT) with budgets large enough for an 80KB file.
      const subReadFiles = new Set();
      for (let subRound = 0; subRound < SUB_MAX_ROUNDS; subRound++) {
        let raw;
        try {
          raw = await sendToZen({ messages: subMessages, tools, signal });
        } catch (e) {
          console.warn(`[SubAgent] Round ${subRound + 1} sendToZen failed:`, e.message);
          break;
        }
        const res = typeof raw === 'string' ? { text: raw, toolCalls: [] } : raw;
        if (res.text) subText = subText ? subText + '\n\n' + res.text : res.text;
        if (!res.toolCalls || res.toolCalls.length === 0) break;
        subMessages.push({
          role: 'assistant',
          content: res.text || null,
          tool_calls: res.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        });
        const subResults = await Promise.all(res.toolCalls.map(tc => {
          if (tc.name === 'read_file') {
            const rKey = `${tc.arguments.path}:${tc.arguments.offset || 0}:${tc.arguments.limit || 8000}`;
            if (subReadFiles.has(rKey)) {
              return Promise.resolve({
                tc,
                result: { success: true, content: `[Already loaded: ${tc.arguments.path} — see prior tool response above]` },
              });
            }
            subReadFiles.add(rKey);
          }
          return executeWithRetry(tc, () => executeTool(tc.name, tc.arguments, ghCtx, ft, { runSubAgent, depth: subDepth }))
            .then(r => ({ tc, result: r }))
            .catch(e => ({ tc, result: { success: false, content: `Error: ${e.message}` } }));
        }));
        for (const { tc, result: subResult } of subResults) {
          let content = subResult.content || '';
          if (content.length > SUB_MAX_TOOL_CONTENT) {
            const subWarning = `\n[Sub-agent output truncated at ${SUB_MAX_TOOL_CONTENT.toLocaleString()} chars. Use more specific queries to narrow results.]`;
            content = content.slice(0, SUB_MAX_TOOL_CONTENT) + subWarning;
          }
          subMessages.push({ role: 'tool', tool_call_id: tc.id, content });
        }
        const subSize = estimateMessagesSize(subMessages);
        console.log(`[SubAgent] Round ${subRound + 1} done. Messages size: ${subSize} chars`);
        if (subSize > SUB_MAX_CHARS) {
          console.warn(`[SubAgent] Budget exceeded (${subSize} > ${SUB_MAX_CHARS}), stopping.`);
          break;
        }
      }
      if (!subText) {
        const toolResults = [];
        for (let i = subMessages.length - 1; i >= 0; i--) {
          const msg = subMessages[i];
          if (msg.role === 'tool' && msg.content) {
            toolResults.unshift(msg.content);
          }
        }
        if (toolResults.length > 0) {
          subText = toolResults.join('\n\n').slice(0, 8000);
        }
      }
      globalMonitor.endInvocation({ output: subText });
      return subText;
    };

      // F1: execute tool calls SEQUENTIALLY. Parallel (Promise.all) execution
      // was corrupting edits: two `edit` calls to the same file in one round
      // both read the same pre-edit content and both persisted — the last
      // finisher won, silently dropping one change (which the model then
      // "re-fixed" in a loop). Sequential execution serializes per file, so
      // each edit sees the previous one's result and a same-round read after an
      // edit serves the fresh content with current line numbers.
      const toolResults = [];
      for (let idx = 0; idx < toolCalls.length; idx++) {
        const tc = toolCalls[idx];
        const toolStart = performance.now();
        // Execution-time gate: never execute a tool that wasn't sent to the
        // model this round. The model sometimes keeps calling tools that were
        // stripped (search_code / list_files / etc.) because it saw them in
        // earlier context; executing them would silently keep it in exploration
        // mode. Return a synthetic "unavailable" result instead so it pivots.
        if (!currentToolNames.has(tc.name)) {
          console.warn(`[ToolRound] Blocking ${tc.name} — not in this round's available tools`);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          const generationHint = forceGenerationInjected
            ? ' You are in GENERATION MODE: produce code changes now. Call "edit" (or "write" for a new file), or output code blocks as text.'
            : '';
          const modeHint = currentMode === 'edit'
            ? ` You are in EDIT mode (${[...currentToolNames].filter(n => n !== 'set_mode').join(', ')} available). Call set_mode("research") to use search/list tools again.`
            : '';
          toolResults.push({
            tc,
            result: {
              success: false,
              content: `[Tool unavailable: ${tc.name} is not in this round's available tools.${generationHint}${modeHint}]`,
            },
            error: null,
          });
          continue;
        }
        if (tc.name === 'set_mode') {
          const targetMode = tc.arguments?.mode === 'edit' ? 'edit' : 'research';
          currentMode = targetMode;
          autoFlippedToEdit = false;
          console.warn(`[ToolRound] set_mode(${targetMode}) at round ${rounds + 1}`);
          onToolProgress?.({ tool: 'set_mode', index: idx + 1, total: totalTools, status: 'done' });
          const editToolList = 'edit, write, read_file, LSP verification (get_lsp_references/get_lsp_type_info/get_lsp_call_graph), set_mode';
          toolResults.push({
            tc,
            result: {
              success: true,
              content: `[Mode set to "${targetMode}". ${targetMode === 'edit' ? `Available tools now: ${editToolList}. If you need to search the codebase again, call set_mode("research").` : 'All search, read, graph and editing tools are available again.'}]`,
            },
            error: null,
          });
          continue;
        }
        if (tc.name === 'read_file' && tc.arguments?.path) {
          const key = readKey(tc);
          const filePath = normalizePath(tc.arguments.path);
          const off = Math.max(1, parseInt(tc.arguments.offset, 10) || 1);
          const lim = Math.min(parseInt(tc.arguments.limit, 10) || 8000, 10000);
          // A1: the read window is recorded later during duplicate detection
          // (AFTER the coverage check) so a read is never compared against its
          // own just-recorded range — recording it here made every read look
          // like a duplicate, which falsely triggered read-stall and
          // research-loop nudges.
          // Serve the requested range from the exact cached content FIRST so
          // re-reads return real text (needed for precise edit oldString).
          const fullCached = originalFileContents.get(filePath);
          if (fullCached) {
            const lines = fullCached.split('\n');
            if (off <= lines.length) {
              const endLine = Math.min(off + lim - 1, lines.length);
              const sliced = lines.slice(off - 1, off - 1 + lim).map((l, i) => `${off + i}: ${l}`).join('\n');
              // The edit tool's availability used to depend on filesReadCount(),
              // but reads served from this cache bypassed executeTool (where the
              // counter is incremented), leaving edit permanently unavailable in
              // any session with a hydrated content store. Count cache hits too
              // so the counter always reflects real reads.
              recordFileRead();
              console.log(`[ToolRound] Serving ${filePath} lines ${off}-${endLine} from cache (${fullCached.length} chars total)`);
              onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
              globalMonitor.recordTool({ toolName: tc.name, args: tc.arguments, result: '[cache-hit]', duration: 0 });
              toolResults.push({
                tc,
                result: { success: true, content: `[Read ${filePath}: lines ${off}-${endLine} of ${lines.length}]\n${sliced}` },
                error: null,
              });
              continue;
            }
          }

          readFiles.set(key, true);
          if (filePath && !originalFileContents.has(filePath) && !editedFilePaths.has(filePath)) {
            const store = getContentStore();
            const b64Store = getBase64Store();
            if (store._hydrated && b64Store._hydrated) {
              const entry = store.getEntry(`repo:${filePath}`) || store.getEntry(`github:${filePath}`);
              if (entry) {
                const chunks = b64Store.getChunks(entry.chunks.map(c => c.id));
                if (chunks.length > 0) {
                  originalFileContents.set(filePath, joinChunks(chunks).replace(/\r\n/g, '\n'));
                }
              }
            }
          }
        }
        console.log(`[ToolRound] Executing: ${tc.name}(${JSON.stringify(tc.arguments)})`);
        onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'executing' });
        try {
          const result = await executeWithRetry(tc, () => executeTool(tc.name, tc.arguments, githubContext, fileTree, { runSubAgent, depth: 0 }));
          if (tc.name === 'read_file' && result._fullContent) {
            const fp = normalizePath(tc.arguments?.path);
            if (fp && !originalFileContents.has(fp) && !editedFilePaths.has(fp)) {
              originalFileContents.set(fp, result._fullContent.replace(/\r\n/g, '\n'));
            }
          }
          if ((tc.name === 'edit' || tc.name === 'write') && result.success && tc.arguments?.filePath) {
            if (currentMode !== 'edit') {
              currentMode = 'edit';
              autoFlippedToEdit = true;
              console.warn(`[ToolRound] Auto-switched to EDIT mode after successful ${tc.name} (round ${rounds + 1})`);
            }
            const fp = normalizePath(tc.arguments.filePath);
            if (fp && !preEditBaselines.has(fp) && originalFileContents.has(fp)) {
              preEditBaselines.set(fp, originalFileContents.get(fp));
            }
            if (fp) {
              originalFileContents.delete(fp);
              editedFilePaths.add(fp);
            }
          }
          const toolDuration = Math.round(performance.now() - toolStart);
          globalMonitor.recordTool({
            toolName: tc.name,
            args: tc.arguments,
            result: result.content,
            duration: toolDuration,
            error: result.success ? null : new Error(result.content?.slice(0, 100)),
          });
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'done' });
          toolResults.push({ tc, result: { success: result.success, content: result.content }, error: null });
        } catch (error) {
          const toolDuration = Math.round(performance.now() - toolStart);
          globalMonitor.recordTool({
            toolName: tc.name,
            args: tc.arguments,
            result: null,
            duration: toolDuration,
            error,
          });
          console.warn(`[ToolRound] Tool ${tc.name} failed:`, error.message);
          onToolProgress?.({ tool: tc.name, index: idx + 1, total: totalTools, status: 'error' });
          toolResults.push({ tc, result: { success: false, content: `Error: ${error.message}` }, error });
        }
      }

      for (const { tc, result } of toolResults) {
        if ((tc.name === 'edit' || tc.name === 'write') && result.success && tc.arguments?.filePath) {
          const fp = normalizePath(tc.arguments.filePath);
          originalFileContents.delete(fp);
          fileLastEditRound.set(fp, rounds);
        }
      }

    const usefulCount = toolResults.filter(({ tc, result }) => isUsefulToolResult(result.content, tc.name)).length;
    const uselessCount = toolResults.length - usefulCount;
    if (usefulCount > uselessCount) {
      consecutiveUnhelpfulRounds = 0;
    } else {
      consecutiveUnhelpfulRounds++;
      for (const { tc, result } of toolResults) {
        const preview = (result.content || '').slice(0, 150).replace(/\n/g, ' ');
        console.warn(`[ToolRound] Round ${rounds + 1}: ${tc.name} → unhelpful (${result.content?.length || 0} chars): "${preview}"`);
      }
      console.warn(`[ToolRound] Unhelpful streak: ${consecutiveUnhelpfulRounds}/${MAX_UNHELPFUL_ROUNDS}`);
    }

    // R2: overlap-aware duplicate detection. A read_file is a duplicate when its
    // requested window is >= 80% covered by a prior read of the same file that
    // happened AFTER the file's last edit (line numbers legitimately shift
    // after an edit, so those re-reads are NOT duplicates).
    const isRangeCovered = (filePath, start, end) => {
      const ranges = fileReadRanges.get(filePath);
      if (!ranges) return false;
      const lastEdit = fileLastEditRound.get(filePath) ?? -1;
      const reqLen = end - start + 1;
      if (reqLen <= 0) return false;
      for (const r of ranges) {
        if (r.round < lastEdit) continue;
        const overlap = Math.max(0, Math.min(end, r.end) - Math.max(start, r.start) + 1);
        if (overlap / reqLen >= 0.8) return true;
      }
      return false;
    };

    const fileDupCounts = new Map();
    let readDupCount = 0;
    for (const tc of toolCalls) {
      if (tc.name !== 'read_file' || !tc.arguments?.path) continue;
      const fp = normalizePath(tc.arguments.path);
      const start = Math.max(1, parseInt(tc.arguments.offset, 10) || 1);
      const end = start + Math.min(parseInt(tc.arguments.limit, 10) || 8000, 10000) - 1;
      // A1: record the window AFTER the coverage check so the current read is
      // not compared against its own range. Same-round overlapping re-reads of
      // the same region are still detected because their range was recorded on
      // an earlier iteration of this loop.
      let ranges = fileReadRanges.get(fp);
      if (!ranges) { ranges = []; fileReadRanges.set(fp, ranges); }
      if (isRangeCovered(fp, start, end)) {
        readDupCount++;
        fileDupCounts.set(fp, (fileDupCounts.get(fp) || 0) + 1);
      }
      ranges.push({ start, end, round: rounds });
    }
    const allDuplicateReads = toolCalls.length > 0 && readDupCount >= Math.ceil(toolCalls.length / 2);

    if (allDuplicateReads) {
      duplicateReadRounds++;
      console.warn(`[ToolRound] Round ${rounds + 1}: ${readDupCount}/${toolCalls.length} read_file calls are duplicates (${duplicateReadRounds}/${MAX_SAME_FILE_READS})`);
    } else {
      duplicateReadRounds = 0;
    }

    // NOTE: no hard break on unhelpful streaks / duplicate reads. Those are
    // signals that feed the self-redirect block below, which re-orients the
    // agent (keeping all tools) instead of cutting the plan short.

    for (const { tc, result: toolResult } of toolResults) {
      if ((tc.name === 'edit' || tc.name === 'write') && tc.arguments?.filePath) {
        // F2: store normalized paths so the synthetic-block generation below
        // finds the matching repo:<path> entry even when the model passed a
        // "./"-prefixed path. Un-normalized paths silently dropped the edited
        // file from the response, so SpaceChat never recorded the change.
        editedFilePaths.add(normalizePath(tc.arguments.filePath));
        // Fix 1: mark that the agent has transitioned from exploration → generation.
        if (toolResult.success) producedEdit = true;
      }
      let content = toolResult.content;
      if (content && content.length > MAX_TOOL_RESULT_CHARS) {
        content = content.slice(0, MAX_TOOL_RESULT_CHARS) + TRUNCATION_WARNING;
      }
      currentMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content,
      });
    }

    // Fix 1: hard cap enforcement — after the final allowed round's tools are
    // executed and results pushed, the run ends (next loop iteration would hit
    // the `rounds >= MAX_ROUNDS` guard anyway).
    if (isFinalRound) {
      console.warn(`[ToolRound] Hard cap (${MAX_ROUNDS} rounds) reached after final round — ending run`);
      break;
    }

    if (autoFlippedToEdit) {
      autoFlippedToEdit = false;
      currentMessages = [...currentMessages, {
        role: 'user',
        content: `[Harness: your first successful edit switched the harness to EDIT mode. Available tools now: edit, write, read_file, LSP verification tools, set_mode. If you need to search or list files again, call set_mode("research").]`,
      }];
    }

    // C2: when a specific file is being re-read round after round with no edit
    // to it, inject a targeted advisory nudge pointing at the exact content
    // already in context. Advisory only — every tool stays available.
    for (const [fp, count] of fileDupCounts) {
      if (editedFilePaths.has(fp)) continue;
      const prevNudge = readStallNudgeRound.get(fp) ?? -Infinity;
      if (count >= 1 && rounds - prevNudge >= 5) {
        const ranges = fileReadRanges.get(fp) || [];
        const last = ranges[ranges.length - 1];
        const rangeHint = last ? `lines ${last.start}-${last.end}` : 'current content';
        readStallNudgeRound.set(fp, rounds);
        currentMessages = [...currentMessages, {
          role: 'user',
          content: `📌 READ-STALL HINT (round ${rounds + 1}): You have already read "${fp}" (${rangeHint}) and its current content is in the context above. Re-reading the same region yields no new information. Craft the exact oldString from the content already shown and call "edit" now; if a re-read is truly needed, read only the narrow slice around your target line. When you are ready, call set_mode("edit") to switch to the editing tool set.`,
        }];
        console.warn(`[ToolRound] C2: read-stall nudge for ${fp} at round ${rounds + 1}`);
      }
    }

    // ── Self-redirect: research loops & confusion ──────────────────────────
    // No absolute round cap — a user's plan can be arbitrarily large, so the
    // run keeps working through it. When the agent is stuck (research loop:
    // unhelpful rounds, duplicate reads, doom-loop tool spam) or visibly
    // confused (uncertainty phrasing / retryable tool failures), inject a
    // re-orienting nudge with ALL tools intact. The nudge escalates each time,
    // so a genuinely stuck run converges to a best-effort partial result (the
    // model ends its own tool calls) instead of looping forever.
    const researchLoopDetected = doomLoopDetected ||
      consecutiveUnhelpfulRounds >= MAX_UNHELPFUL_ROUNDS ||
      duplicateReadRounds >= MAX_SAME_FILE_READS;

    if (CONFUSION_PATTERNS.test(text || '')) {
      consecutiveConfusionSignals++;
      console.warn(`[ToolRound] Confusion signal in round ${rounds + 1} text (${consecutiveConfusionSignals}/${CONFUSION_SIGNAL_THRESHOLD})`);
    } else if (toolResults.some(({ tc, result: r }) => !r.success && RETRYABLE_TOOLS.has(tc.name))) {
      consecutiveConfusionSignals++;
      console.warn(`[ToolRound] Confusion signal: retryable tool failure in round ${rounds + 1} (${consecutiveConfusionSignals}/${CONFUSION_SIGNAL_THRESHOLD})`);
    } else {
      consecutiveConfusionSignals = Math.max(0, consecutiveConfusionSignals - 1);
    }
    const confusionDetected = consecutiveConfusionSignals >= CONFUSION_SIGNAL_THRESHOLD;

    // Fires regardless of producedEdit: a multi-step plan can hit a research
    // loop or confusion at any point, not just before the first edit.
    if ((researchLoopDetected || confusionDetected) && rounds !== lastRedirectRound) {
      redirectCount++;
      lastRedirectRound = rounds;
      consecutiveUnhelpfulRounds = 0;
      duplicateReadRounds = 0;
      consecutiveConfusionSignals = 0;
      const phase = confusionDetected ? 'confusion' : 'research-loop';
      console.warn(`[ToolRound] Self-redirect #${redirectCount} (${phase}) at round ${rounds + 1} — all tools remain available`);
      currentMessages = [...currentMessages, buildSelfRedirectMessage({
        round: rounds + 1,
        redirectCount,
        phase,
        editsSoFar: [...editedFilePaths],
      })];
      if (rounds - lastDigestRound >= DIGEST_REFRESH_INTERVAL) {
        lastDigestRound = rounds;
        try {
          const digest = await synthesizeFindingsDigest(currentMessages, originalFileContents, getContentStore, getBase64Store);
          if (digest) {
            currentMessages = [...currentMessages, {
              role: 'user',
              content: `📋 REFRESHED FINDINGS DIGEST (round ${rounds + 1}):\n\n${digest}\n\nUse this to identify what remains. To craft an exact edit oldString, re-read only the narrow slice around the target line; do not re-read whole files. When your edit targets are set, call set_mode("edit") to switch to the editing tool set.`,
            }];
            console.warn(`[ToolRound] Self-redirect: refreshed digest at round ${rounds + 1} (${digest.length} chars)`);
          }
        } catch (e) {
          console.warn(`[ToolRound] Self-redirect: digest refresh failed: ${e.message}`);
        }
      }
    }

    // ── Fix 2 (enforced): break the research loop by forcing EDIT mode ──────
    // The self-redirect nudge above keeps every tool available (advisory only),
    // which lets a stubborn model keep re-reading forever. Once the agent has
    // been flagged as stuck (prior self-redirect, two+ read-stall files, or
    // exploration past the threshold) with no edits, actually flip the harness
    // to EDIT mode: computeTools({ mode: 'edit' }) strips search/list/graph
    // tools next round, so the model must either edit or finish.
    if (!producedEdit && !forcedEditMode && currentMode === 'research') {
      const stuck = redirectCount >= 1 || readStallNudgeRound.size >= 2 || rounds >= MAX_EXPLORATION_ROUNDS;
      if (stuck) {
        forcedEditMode = true;
        currentMode = 'edit';
        currentMessages = [...currentMessages, {
          role: 'user',
          content: `[Harness: research loop detected (repeated reads, no edits yet) — switching to EDIT MODE. Search/list/graph tools are removed from the next round. Available now: edit, write, read_file, LSP verification tools, set_mode. Produce your changes with exact oldString from the file content already shown above. Call set_mode("research") only if a specific edit truly needs more context.]`,
        }];
        console.warn(`[ToolRound] Fix 2: forced EDIT mode at round ${rounds + 1} (0 edits, research loop) — search tools stripped`);
      }
    }

    onToolProgress?.({ tool: 'done', index: totalTools, total: totalTools, status: 'complete' });
    globalMonitor.endInvocation({ output: finalText, tokens: toolResults.length });
    rounds++;
  }

  if (editedFilePaths.size > 0) {
    const store = getContentStore();
    const base64Store = getBase64Store();
    const appliedEditRecords = getAppliedEditRecords();
    const syntheticBlocks = [];
    for (const filePath of editedFilePaths) {
      const storeId = `repo:${filePath}`;
      const entry = store.getEntry(storeId);
      if (!entry) continue;
      const chunks = base64Store.getChunks(entry.chunks.map(c => c.id));
      const modifiedContent = joinChunks(chunks);
      if (!modifiedContent) continue;
      const ext = filePath.split('.').pop() || 'txt';
      // A1: always try to emit a search/replace PATCH (diff), never a full-file
      // rewrite. If the original content wasn't cached (e.g. the file was
      // fetched for the first time during this run), fetch it from GitHub so we
      // can diff against the true pre-edit state. A full-file block is NEVER
      // emitted — if no original can be obtained, fall back to the exact hunks
      // recorded by the edit tool, and if even those are missing, skip the file.
      let originalContent = preEditBaselines.get(filePath) ?? originalFileContents.get(filePath);
      if (!originalContent && githubContext) {
        try {
          originalContent = await fetchFileContent(
            githubContext.owner,
            githubContext.repo,
            filePath,
            githubContext.token,
          );
        } catch { /* fall through to edit-record hunks */ }
      }
      if (originalContent) originalContent = originalContent.replace(/\r\n/g, '\n');
      const normalizedModified = modifiedContent.replace(/\r\n/g, '\n');
      if (originalContent && originalContent !== normalizedModified) {
        const patch = generateSearchReplacePatch(originalContent, normalizedModified, filePath);
        if (patch) {
          // Remove the model's own block for this file (if any) so it cannot
          // shadow the canonical patch or make the SEARCH fail to match.
          finalText = stripModelCodeBlockForFile(finalText, filePath);
          syntheticBlocks.push(patch);
          continue;
        }
        console.warn(`[ToolRound] ${filePath}: could not synthesize a minimal diff — falling back to edit-record hunks`);
      } else if (originalContent && originalContent === normalizedModified) {
        console.warn(`[ToolRound] ${filePath}: no net change after edits — skipping synthetic block`);
        continue;
      }

      // No trustworthy pre-edit original: reconstruct minimal hunks from the
      // exact edits that were applied this run. These match the GitHub baseline
      // by construction (the edit tool applied them to that content).
      const records = appliedEditRecords.filter(r => r.filePath === filePath);
      if (records.length > 0) {
        const hunks = records.map(r => {
          const lines = [];
          lines.push(`<<<<<<< SEARCH`);
          lines.push(r.oldString);
          lines.push(`=======`);
          lines.push(r.newString);
          lines.push(`>>>>>>> REPLACE`);
          return lines.join('\n');
        });
        syntheticBlocks.push(`\`\`\`${ext}:${filePath}\n${hunks.join('\n\n')}\n\`\`\``);
        continue;
      }
      // A write to a path that isn't in the repo's file tree is a NEW file —
      // a full-file block is the only correct representation (and safe, since
      // it's a create, not an overwrite). Existing files with no reconstructable
      // diff are skipped rather than re-emitted wholesale.
      if (!fileTree.includes(filePath)) {
        syntheticBlocks.push(`\`\`\`${ext}:${filePath}\n${modifiedContent}\n\`\`\``);
      } else {
        console.warn(`[ToolRound] ${filePath}: cannot synthesize a minimal patch (no original and no edit records) — skipped`);
      }
    }
    if (syntheticBlocks.length > 0) {
      const blockText = syntheticBlocks.join('\n\n');
      finalText = finalText ? finalText + '\n\n' + blockText : blockText;
      console.log(`[ToolRound] Generated ${syntheticBlocks.length} synthetic code block(s) from edit/write tools`);
    }
  }

  const usageReport = globalRouter.getUsageReport();
  console.log(`[sendWithRetrieval] Model usage:`, JSON.stringify(usageReport));

  globalMonitor.endInvocation({
    output: finalText,
    tokens: rounds,
  });

  return stripRetrievalMarkers(finalText);
}
