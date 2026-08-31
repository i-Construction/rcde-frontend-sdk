function allowedTokens(): string[] {
  const listed = (process.env.INBOX_TOKENS ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (listed.length > 0) {
    return listed;
  }
  const single = (process.env.INBOX_TOKEN ?? "").trim();
  if (single !== "") {
    return [single];
  }
  return [];
}

export function isInboxTokenValid(token: string): boolean {
  if (token.length === 0) {
    return false;
  }
  const allowed = allowedTokens();
  if (allowed.length === 0) {
    return true;
  }
  return allowed.includes(token);
}
