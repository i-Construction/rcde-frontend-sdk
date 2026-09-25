/**
 * R-CDE 外部 API の認証方式。SDK は 2-legged のみ対応する。
 * 3-legged（`/ext/v2/userAuthenticated`）は対応外で、指定しても受け付けない。
 */
export type AuthType = "2legged";
