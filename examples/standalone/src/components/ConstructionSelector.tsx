"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import {
  describeConstructionsApiError,
  fetchConstructions,
  fetchContracts,
  type Construction,
  type Contract,
} from "@/lib/constructions-browser-api";

type Props = {
  accessToken: string;
};

export function ConstructionSelector({ accessToken }: Props) {
  const router = useRouter();
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedConstruction, setSelectedConstruction] = useState<Construction | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [error, setError] = useState("");

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState("");

  // アンマウント後の setState を避けるため、呼び出し側から中断済みかを渡す。
  const loadConstructions = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      setLoading(true);
      setError("");
      try {
        const constructionList = await fetchConstructions(accessToken);
        if (isCancelled()) return;
        setConstructions(constructionList);
      } catch (caught) {
        if (isCancelled()) return;
        setError(describeConstructionsApiError(caught));
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    let cancelled = false;
    void loadConstructions(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [loadConstructions]);

  const handleSelectConstruction = async (construction: Construction) => {
    setSelectedConstruction(construction);
    setContracts([]);
    setContractsLoading(true);
    setError("");
    try {
      setContracts(await fetchContracts(accessToken, construction.id));
    } catch {
      setError("契約一覧の取得に失敗しました");
    } finally {
      setContractsLoading(false);
    }
  };

  const handleSelectContract = (contract: Contract) => {
    if (!selectedConstruction) return;
    const params = new URLSearchParams({
      constructionId: String(selectedConstruction.id),
      contractId: String(contract.id),
      constructionName: selectedConstruction.name,
      contractName: contract.name,
    });
    router.push(`/viewer?${params.toString()}`);
  };

  const handleBackToConstructions = () => {
    setSelectedConstruction(undefined);
    setContracts([]);
    setError("");
  };

  const handleSetupTestData = async () => {
    setSetupLoading(true);
    setError("");
    setSetupSuccess("");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const setupResponse = await res.json();
      if (!res.ok) {
        setError(setupResponse.error ?? "テストデータの作成に失敗しました");
        return;
      }
      setSetupSuccess(setupResponse.message ?? "テストデータを作成しました");
      await loadConstructions();
    } catch {
      setError("テストデータの作成に失敗しました");
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Card sx={{ maxWidth: 600, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            現場・契約選択
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {error}
            </Alert>
          )}

          {setupSuccess && (
            <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
              {setupSuccess}
            </Alert>
          )}

          {!selectedConstruction && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                現場を選択
              </Typography>

              {loading && (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {!loading && constructions.length === 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    現場が見つかりませんでした
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSetupTestData}
                    disabled={setupLoading}
                    sx={{ mt: 1 }}
                  >
                    {setupLoading ? (
                      <CircularProgress size={18} sx={{ mr: 1 }} />
                    ) : (
                      "テストデータを作成"
                    )}
                  </Button>
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    2-legged API でテスト用の現場と契約を自動作成します
                  </Typography>
                </Box>
              )}

              {!loading && constructions.length > 0 && (
                <List dense>
                  {constructions.map((c) => (
                    <ListItemButton key={c.id} onClick={() => handleSelectConstruction(c)}>
                      <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </>
          )}

          {selectedConstruction && (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="subtitle2">契約を選択</Typography>
                <Button size="small" onClick={handleBackToConstructions}>
                  現場一覧に戻る
                </Button>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                現場: {selectedConstruction.name} (ID: {selectedConstruction.id})
              </Typography>

              <Divider sx={{ mb: 1 }} />

              {contractsLoading && (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {!contractsLoading && contracts.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  契約が見つかりませんでした
                </Typography>
              )}

              {!contractsLoading && contracts.length > 0 && (
                <List dense>
                  {contracts.map((c) => (
                    <ListItemButton key={c.id} onClick={() => handleSelectContract(c)}>
                      <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
