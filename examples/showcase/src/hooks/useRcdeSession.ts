"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuthType, RCDEAppConfig } from "@i-con/frontend-sdk";
import { RCDE_PROXY_BASE_URL } from "@/lib/env";

/**
 * このサンプルの認証方式。`AuthType` は `"2legged" | "3legged"` で、
 * `RCDEClient` が組み立てる API パスの接頭辞（`/ext/v2/authenticated` か
 * `/ext/v2/userAuthenticated`）を決める。
 */
const AUTH_TYPE: AuthType = "2legged";

type TokenResponse = {
  accessToken?: string;
  expiresAt?: number;
  error?: string;
  code?: string;
};

export type RcdeSession =
  | { status: "loading" }
  | { status: "missing-credentials"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; app: RCDEAppConfig; expiresAt: number | undefined };

/**
 * `/api/auth/token` から 2-legged のアクセストークンを取得し、
 * SDK の `app` prop（`RCDEAppConfig`）を組み立てる。
 *
 * `baseUrl` は RCDE API を直叩きせず自前プロキシを指す。ブラウザから
 * `https://api.rcde.jp` へ直接投げると CORS で失敗するため。
 */
export function useRcdeSession(): RcdeSession & { reload: () => void } {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [expiresAt, setExpiresAt] = useState<number | undefined>(undefined);
  const [failure, setFailure] = useState<
    { kind: "missing" | "error"; message: string } | undefined
  >(undefined);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setFailure(undefined);
      try {
        const res = await fetch("/api/auth/token", { cache: "no-store" });
        const data = (await res.json()) as TokenResponse;
        if (cancelled) return;

        if (!res.ok || !data.accessToken) {
          setToken(undefined);
          setFailure({
            kind: data.code === "MISSING_CREDENTIALS" ? "missing" : "error",
            message: data.error ?? `トークン取得に失敗しました (HTTP ${res.status})`,
          });
          return;
        }
        setToken(data.accessToken);
        setExpiresAt(data.expiresAt);
      } catch (error) {
        if (cancelled) return;
        setToken(undefined);
        setFailure({
          kind: "error",
          message: error instanceof Error ? error.message : "トークン取得に失敗しました",
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Viewer は `app` を effect の依存に取るため、値が同じ間は参照を固定する
  const app = useMemo<RCDEAppConfig | undefined>(() => {
    if (token === undefined) {
      return undefined;
    }
    return {
      token,
      baseUrl: RCDE_PROXY_BASE_URL,
      authType: AUTH_TYPE,
    };
  }, [token]);

  if (failure !== undefined) {
    return failure.kind === "missing"
      ? { status: "missing-credentials", message: failure.message, reload }
      : { status: "error", message: failure.message, reload };
  }
  if (app === undefined) {
    return { status: "loading", reload };
  }
  return { status: "ready", app, expiresAt, reload };
}
