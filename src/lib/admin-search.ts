/**
 * Search helpers for admin lists.
 *
 * `matchesQuery` is for lists already in memory: every word of the query has
 * to appear somewhere in the given fields. `ilikeTerm` prepares a term for a
 * PostgREST `or(...)` filter, where commas and parentheses are syntax.
 */
export function matchesQuery(
  query: string,
  ...fields: Array<string | number | null | undefined>
): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = fields
    .map((field) => (field === null || field === undefined ? "" : String(field)))
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

export function ilikeTerm(query: string): string {
  return query
    .trim()
    .replace(/[,()%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
