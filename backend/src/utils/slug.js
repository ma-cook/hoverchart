// Space slugs: a human-readable alias of the form "<username>-<spacename>",
// e.g. "john-doe-team-diagram". The slug is derived once at space creation and
// stored in spaces.slug; the UUID primary key stays the canonical internal id.

/**
 * Reduce one component (username or space name) to lowercase alphanumerics.
 * Diacritics are stripped so "José" -> "jose"; all other runs (spaces,
 * punctuation) are dropped rather than turned into separators so the result
 * reads like a handle: "John Doe" -> "johndoe".
 */
export function slugifyPart(input) {
  if (!input) return '';
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Build the un-deduplicated base slug for a space: "<username>-<spacename>".
 * Username falls back from display_name -> email local-part -> "user"; the
 * space-name component falls back to "space". Capped so the final id stays
 * within the 64-byte buffer the native client uses for space ids.
 */
export function buildSpaceSlug(owner = {}, name) {
  const userPart =
    slugifyPart(owner.display_name) ||
    slugifyPart((owner.email || '').split('@')[0]) ||
    'user';
  const namePart = slugifyPart(name) || 'space';
  const base = `${userPart}-${namePart}`.slice(0, 48);
  return base.replace(/-+$/, '') || 'space';
}

/**
 * Return a slug guaranteed to be unused, appending "-2", "-3", ... on
 * collisions. `isTaken` is an async predicate so callers can back it with the
 * DB (fresh query) or an in-memory set (bulk backfill).
 */
export async function uniqueSlug(base, isTaken) {
  let candidate = base;
  let n = 1;
  while (await isTaken(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}
