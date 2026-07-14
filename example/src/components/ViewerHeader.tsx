"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const HEADER_HEIGHT = 56;
const HEADER_BG = "#166534";

type Construction = {
  id: number;
  name: string;
};

type Contract = {
  id: number;
  name: string;
};

type ViewerHeaderProps = {
  accessToken: string;
  constructionId: number;
  contractId: number;
  constructionName?: string;
  contractName?: string;
};

function resolveConstructionLabel(
  constructionId: number,
  constructionName: string | undefined
): string {
  if (constructionName !== undefined && constructionName.length > 0) {
    return constructionName;
  }
  return `現場 ${constructionId}`;
}

function resolveContractLabel(contractId: number, contractName: string | undefined): string {
  if (contractName !== undefined && contractName.length > 0) {
    return contractName;
  }
  return `契約 ${contractId}`;
}

function navigateToViewer(
  router: ReturnType<typeof useRouter>,
  params: {
    constructionId: number;
    contractId: number;
    constructionName?: string;
    contractName?: string;
  }
): void {
  const query = new URLSearchParams({
    constructionId: String(params.constructionId),
    contractId: String(params.contractId),
  });
  if (params.constructionName) query.set("constructionName", params.constructionName);
  if (params.contractName) query.set("contractName", params.contractName);
  router.push(`/viewer?${query.toString()}`);
}

export function ViewerHeader({
  accessToken,
  constructionId,
  contractId,
  constructionName,
  contractName,
}: ViewerHeaderProps) {
  const router = useRouter();
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const constructionLabel = resolveConstructionLabel(constructionId, constructionName);
  const contractLabel = resolveContractLabel(contractId, contractName);

  const fetchContracts = useCallback(
    async (targetConstructionId: number): Promise<Contract[]> => {
      try {
        const res = await fetch(`/api/constructions?constructionId=${targetConstructionId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.contracts ?? [];
      } catch {
        return [];
      }
    },
    [accessToken]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/constructions", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : { constructions: [] }))
      .then((data) => {
        if (!cancelled) setConstructions(data.constructions ?? []);
      })
      .catch(() => {
        if (!cancelled) setConstructions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    if (constructionId <= 0) return;
    fetchContracts(constructionId).then((nextContracts) => {
      if (!cancelled) setContracts(nextContracts);
    });
    return () => {
      cancelled = true;
    };
  }, [constructionId, fetchContracts]);

  const handleChangeConstruction = useCallback(
    async (event: SelectChangeEvent<number>) => {
      const nextConstructionId = Number(event.target.value);
      const next = constructions.find((c) => c.id === nextConstructionId);
      const nextContracts = await fetchContracts(nextConstructionId);
      setContracts(nextContracts);
      const firstContract = nextContracts[0];
      navigateToViewer(router, {
        constructionId: nextConstructionId,
        contractId: firstContract?.id ?? 0,
        constructionName: next?.name,
        contractName: firstContract?.name,
      });
    },
    [constructions, fetchContracts, router]
  );

  const handleChangeContract = useCallback(
    (event: SelectChangeEvent<number>) => {
      const nextContractId = Number(event.target.value);
      const next = contracts.find((c) => c.id === nextContractId);
      navigateToViewer(router, {
        constructionId,
        contractId: nextContractId,
        constructionName,
        contractName: next?.name,
      });
    },
    [constructionId, constructionName, contracts, router]
  );

  const selectSx = {
    color: "common.white",
    fontSize: 14,
    ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.35)" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.6)" },
    ".MuiSvgIcon-root": { color: "common.white" },
  };

  return (
    <Box
      component="header"
      sx={{
        height: HEADER_HEIGHT,
        flexShrink: 0,
        bgcolor: HEADER_BG,
        color: "common.white",
        borderBottom: 1,
        borderColor: "rgba(255,255,255,0.15)",
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
        }}
      >
        <Box sx={{ fontSize: 14, whiteSpace: "nowrap", opacity: 0.85 }}>frontend-sdk example</Box>
        <NavigateNextIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
        <Select<number>
          size="small"
          value={constructionId}
          onChange={handleChangeConstruction}
          displayEmpty
          renderValue={() => constructionLabel}
          sx={{ ...selectSx, minWidth: 160 }}
        >
          {constructions.length === 0 && (
            <MenuItem value={constructionId}>{constructionLabel}</MenuItem>
          )}
          {constructions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
        <NavigateNextIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
        <Select<number>
          size="small"
          value={contractId}
          onChange={handleChangeContract}
          displayEmpty
          renderValue={() => contractLabel}
          sx={{ ...selectSx, minWidth: 160, fontWeight: 600 }}
        >
          {contracts.length === 0 && <MenuItem value={contractId}>{contractLabel}</MenuItem>}
          {contracts.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}

export { HEADER_HEIGHT };
