const BEARER_PREFIX = "Bearer ";

/**
 * standalone 型のクライアントが送る `Authorization: Bearer <token>` から accessToken を取り出す。
 */
export function extractBearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header === null || !header.startsWith(BEARER_PREFIX)) {
    return undefined;
  }
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : undefined;
}
