"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

type Construction = {
  id: number;
  name: string;
};

type Contract = {
  id: number;
  name: string;
};

type Props = {
  accessToken: string;
  authType: "2legged" | "3legged";
};

export function ConstructionSelector({ accessToken, authType }: Props) {
  const router = useRouter();
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedConstruction, setSelectedConstruction] =
    useState<Construction | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [manualConstructionId, setManualConstructionId] = useState("");
  const [manualContractId, setManualContractId] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState("");

  useEffect(() => {
    fetchConstructions();
  }, []);

  const fetchConstructions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/constructions", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConstructions(data.constructions ?? []);
      }
    } catch {
      setError("現場一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConstruction = async (construction: Construction) => {
    setSelectedConstruction(construction);
    setContracts([]);
    try {
      const res = await fetch(
        `/api/constructions?constructionId=${construction.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts ?? []);
      }
    } catch {
      setError("契約一覧の取得に失敗しました");
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

  const handleManualGo = () => {
    if (manualConstructionId && manualContractId) {
      router.push(
        `/viewer?constructionId=${manualConstructionId}&contractId=${manualContractId}`
      );
    }
  };

  const handleSetupTestData = async () => {
    setSetupLoading(true);
    setError("");
    setSetupSuccess("");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "テストデータの作成に失敗しました");
        return;
      }
      setSetupSuccess(data.message ?? "テストデータを作成しました");
      await fetchConstructions();
    } catch {
      setError("テストデータの作成に失敗しました");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/token", { method: "DELETE" });
    router.push("/login");
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">現場・契約選択</Typography>
            <Button size="small" color="error" onClick={handleLogout}>
              ログアウト
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary">
            認証方式: {authType}
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

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            ID を直接入力
          </Typography>
          <Box display="flex" gap={1} mb={3}>
            <TextField
              size="small"
              label="現場 ID"
              value={manualConstructionId}
              onChange={(e) => setManualConstructionId(e.target.value)}
            />
            <TextField
              size="small"
              label="契約 ID"
              value={manualContractId}
              onChange={(e) => setManualContractId(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleManualGo}
              disabled={!manualConstructionId || !manualContractId}
            >
              表示
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            現場一覧から選択
          </Typography>

          {loading && <CircularProgress size={24} />}

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

          {!loading && constructions.length > 0 && !selectedConstruction && (
            <List dense>
              {constructions.map((c) => (
                <ListItemButton
                  key={c.id}
                  onClick={() => handleSelectConstruction(c)}
                >
                  <ListItemText primary={c.name} secondary={`ID: ${c.id}`} />
                </ListItemButton>
              ))}
            </List>
          )}

          {selectedConstruction && (
            <>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="body2">
                  現場: {selectedConstruction.name} (ID:{" "}
                  {selectedConstruction.id})
                </Typography>
                <Button
                  size="small"
                  onClick={() => setSelectedConstruction(undefined)}
                >
                  戻る
                </Button>
              </Box>

              {contracts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  契約が見つかりませんでした
                </Typography>
              ) : (
                <List dense>
                  {contracts.map((c) => (
                    <ListItemButton
                      key={c.id}
                      onClick={() => handleSelectContract(c)}
                    >
                      <ListItemText
                        primary={c.name}
                        secondary={`ID: ${c.id}`}
                      />
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
