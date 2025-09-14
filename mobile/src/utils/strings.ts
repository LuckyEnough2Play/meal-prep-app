export function canonicalizeName(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') // collapse punctuation to spaces
    .trim()
    .replace(/\s+/g, ' ');
}

export function includesNormalized(haystack: string, needle: string): boolean {
  const h = canonicalizeName(haystack);
  const n = canonicalizeName(needle);
  return h.includes(n);
}

