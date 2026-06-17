"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const handle2LeggedLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Authentication failed");
      }

      // Cookie 設定後に確実に遷移するためフルナビゲーションを使う
      window.location.assign("/viewer");
    } catch (err) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Login failed";
      router.push(`/login?error=${encodeURIComponent(message)}`);
    }
  };

  const handle3LeggedLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_RCDE_CLIENT_ID ?? "";
    const redirectUri = `${window.location.origin}/api/auth/callback`;
    const baseUrl =
      process.env.NEXT_PUBLIC_RCDE_API_BASE_URL ?? "https://api.rcde.jp";
    const authUrl =
      `${baseUrl}/ext/v2/oauth/authorize` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code`;
    window.location.href = authUrl;
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            RCDE PoC Viewer
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: 3 }}
          >
            RCDE Frontend SDK サンプルアプリケーション
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              variant="contained"
              size="large"
              onClick={handle2LeggedLogin}
              disabled={loading}
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "2-legged 認証でログイン"
              )}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handle3LeggedLogin}
              disabled={loading}
              fullWidth
            >
              3-legged 認証でログイン
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
