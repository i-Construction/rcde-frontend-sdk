import { Box, Button } from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ja from "date-fns/locale/ja";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "../../src/contexts/client";
import { ConstructionDetail } from "./ConstructionDetail";
import { ConstructionList } from "./ConstructionList";
import { ContractDetail } from "./ContractDetail";
import { RCDEAppConfig } from "../../src/components/Viewer";

interface Page<Variant extends string = string> {
  variant: Variant;
}

type ConstructionDetail = Page<"construction"> & {
  constructionId: number;
};

type ContractDetail = Page<"contract"> & {
  constructionId: number;
  contractId: number;
};

type Pages = Page<"root"> | ConstructionDetail | ContractDetail | Page<"viewer">;

const Root: FC = () => {
  const [page, setPage] = useState<Pages>({ variant: "root" });
  const { initialize } = useClient();
  const [app, setApp] = useState<RCDEAppConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    return import.meta.env.VITE_API_BASE_URL || 'https://api.rcde.jp';
  }, []);

  const authType = useMemo(() => {
    const type = import.meta.env.VITE_AUTH_TYPE;
    return (type === '3legged' ? '3legged' : '2legged') as '2legged' | '3legged';
  }, []);

  useEffect(() => {
    const fetchAccessToken = async () => {
      const clientId = import.meta.env.VITE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
      const origin = window.location.origin;

      if (!clientId || !clientSecret) {
        setError('VITE_CLIENT_ID と VITE_CLIENT_SECRET を設定してください');
        return;
      }

      try {
        let tokenEndpoint: string;
        let requestBody: Record<string, string>;

        if (authType === '2legged') {
          tokenEndpoint = `${baseUrl}/ext/v2/auth/token`;
          requestBody = { clientId, clientSecret };
        } else {
          // 3leggedの場合はOAuthフローが必要（今回は未実装）
          setError('3legged認証は現在サポートされていません');
          return;
        }

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': origin,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.errors?.[0] || `HTTP ${response.status}`);
        }

        const data = (await response.json()) as {
          accessToken: string;
          refreshToken?: string;
          expiresAt?: number;
        };

        setApp({
          token: data.accessToken,
          baseUrl,
          authType,
        });
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'トークン取得に失敗しました';
        setError(message);
        console.error('Failed to fetch access token:', err);
      }
    };

    fetchAccessToken();
  }, [baseUrl, authType]);

  useEffect(() => {
    if (app) {
      initialize(app);
    }
  }, [app, initialize]);

  const handleBack = useCallback(() => {
    switch (page.variant) {
      case "root": {
        break;
      }
      case "construction": {
        setPage({ variant: "root" });
        break;
      }
      case "contract": {
        setPage({
          variant: "construction",
          constructionId: page.constructionId,
        });
        break;
      }
      default: {
        break;
      }
    }
  }, [page]);

  const handleSelectContract = useCallback(
    (props: { constructionId: number; contractId: number }) => {
      setPage({ variant: "contract", ...props });
    },
    []
  );

  const p = useMemo(() => {
    switch (page.variant) {
      case "root": {
        return (
          <ConstructionList
            onSelect={(constructionId) => {
              setPage({ variant: "construction", constructionId });
            }}
          />
        );
      }
      case "construction": {
        return (
          <ConstructionDetail
            id={page.constructionId}
            onSelect={handleSelectContract}
          />
        );
      }
      case "contract": {
        return (
          <ContractDetail
            app={app}
            constructionId={page.constructionId}
            contractId={page.contractId}
          />
        );
      }
      default: {
        return null;
      }
    }
  }, [page, app, handleSelectContract]);

  if (error) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ color: 'error.main', mb: 2 }}>エラー: {error}</Box>
          <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
            .envファイルに VITE_CLIENT_ID と VITE_CLIENT_SECRET を設定してください。
          </Box>
        </Box>
      </LocalizationProvider>
    );
  }

  if (!app) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
        <Box sx={{ p: 2 }}>トークンを取得しています...</Box>
      </LocalizationProvider>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box width={1} height={1} display="flex" flexDirection={"column"}>
        <Box>
          <Button
            fullWidth
            onClick={handleBack}
            disabled={page.variant === "root"}
          >
            戻る
          </Button>
        </Box>
        {p}
      </Box>
    <Box sx={{ p:2, display:'flex', gap:1 }}>
  <Button variant="outlined" onClick={() => setPage({ variant: "root" })}>Home</Button>
  <Button variant="outlined" onClick={() => setPage({ variant: "viewer" })}>Viewer</Button>
</Box>
</LocalizationProvider>

  );
};

export { Root };
