"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box, Breadcrumbs, Typography } from "@mui/material";

const HEADER_HEIGHT = 56;
const HEADER_BG = "#166534";

type ViewerHeaderProps = {
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

export function ViewerHeader({
  constructionId,
  contractId,
  constructionName,
  contractName,
}: ViewerHeaderProps) {
  const constructionLabel = resolveConstructionLabel(constructionId, constructionName);
  const contractLabel = resolveContractLabel(contractId, contractName);

  const breadcrumbTextSx = {
    color: "common.white",
    fontSize: 14,
  };

  const separator = (
    <NavigateNextIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.7)" }} />
  );

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
          px: 2,
        }}
      >
        <Breadcrumbs
          separator={separator}
          aria-label="現場・契約"
          sx={{ "& .MuiBreadcrumbs-li": { display: "flex", alignItems: "center" } }}
        >
          <Typography sx={breadcrumbTextSx}>frontend-sdk example</Typography>
          <Typography sx={breadcrumbTextSx}>{constructionLabel}</Typography>
          <Typography sx={{ ...breadcrumbTextSx, fontWeight: 600 }}>
            {contractLabel}
          </Typography>
        </Breadcrumbs>
      </Box>
    </Box>
  );
}

export { HEADER_HEIGHT };
