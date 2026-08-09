// Minimal line-diff utilities for turning an edit into SEARCH/REPLACE hunks.
// Shared by toolExecutor (records minimal applied edits) and
// retrievalOrchestrator (synthesizes minimal code blocks). Hunks are produced
// so that:
//   - each hunk is a contiguous region of change (insert/delete/replace),
//   - a pure insertion NEVER yields an empty oldString (downstream consumers
//     match via indexOf, which would anchor an empty search at position 0 and
//     corrupt the file) — insertions are anchored to a unique neighboring
//     run of lines,
//   - whole-file rewrites are returned as a single full-content hunk (a real
//     diff, never an echo of a model-supplied block).

function lineDiff(beforeLines, afterLines) {
  const n = beforeLines.length;
  const m = afterLines.length;
  const dp = new Int32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const idx = i * (m + 1) + j;
      if (beforeLines[i] === afterLines[j]) {
        dp[idx] = dp[(i + 1) * (m + 1) + j + 1] + 1;
      } else {
        const keep = dp[(i + 1) * (m + 1) + j];
        const take = dp[i * (m + 1) + j + 1];
        dp[idx] = keep >= take ? keep : take;
      }
    }
  }
  return dp;
}

function countOccurrences(lines, anchor) {
  const haystack = lines.join('\n');
  const needle = anchor.join('\n');
  let count = 0;
  let pos = haystack.indexOf(needle);
  while (pos !== -1) {
    count++;
    pos = haystack.indexOf(needle, pos + 1);
  }
  return count;
}

// Grow an anchor around a pure insertion so the resulting SEARCH block matches
// uniquely. Anchor above the insert point when possible (preceding lines),
// otherwise anchor below it (following lines, e.g. top-of-file inserts).
function anchorInsert(beforeLines, insertLineIndex, insertedLines) {
  if (insertLineIndex > 0) {
    let len = 1;
    while (len <= insertLineIndex) {
      const anchor = beforeLines.slice(insertLineIndex - len, insertLineIndex);
      if (countOccurrences(beforeLines, anchor) === 1) {
        return { search: anchor, replace: [...anchor, ...insertedLines] };
      }
      len++;
    }
  } else {
    let len = 1;
    while (len <= beforeLines.length) {
      const anchor = beforeLines.slice(0, len);
      if (countOccurrences(beforeLines, anchor) === 1) {
        return { search: anchor, replace: [...insertedLines, ...anchor] };
      }
      len++;
    }
  }
  return null;
}

export function diffToHunks(before, after) {
  if (before === after) return [];
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  if (beforeLines.length === 0 || afterLines.length === 0) {
    return [{ oldString: before, newString: after }];
  }
  const dp = lineDiff(beforeLines, afterLines);
  const m = afterLines.length;
  const hunks = [];
  let i = 0;
  let j = 0;
  let search = [];
  let replace = [];
  const flush = () => {
    if (search.length === 0 && replace.length === 0) return;
    if (search.length === 0) {
      const anchored = anchorInsert(beforeLines, i, replace);
      if (anchored) {
        hunks.push({ oldString: anchored.search.join('\n'), newString: anchored.replace.join('\n') });
      }
    } else {
      hunks.push({ oldString: search.join('\n'), newString: replace.join('\n') });
    }
    search = [];
    replace = [];
  };
  while (i < beforeLines.length || j < afterLines.length) {
    if (i < beforeLines.length && j < afterLines.length && beforeLines[i] === afterLines[j]) {
      flush();
      i++;
      j++;
      continue;
    }
    const keep = i < beforeLines.length ? dp[(i + 1) * (m + 1) + j] : -1;
    const take = j < afterLines.length ? dp[i * (m + 1) + j + 1] : -1;
    if (i < beforeLines.length && (j >= afterLines.length || keep >= take)) {
      search.push(beforeLines[i]);
      i++;
    } else if (j < afterLines.length) {
      replace.push(afterLines[j]);
      j++;
    }
  }
  flush();
  return hunks;
}
