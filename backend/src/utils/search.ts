// Builds an ILIKE "contains" pattern, treating % and _ in the input as literal characters
export function containsPattern(value: string) {
  const escaped = value.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}
