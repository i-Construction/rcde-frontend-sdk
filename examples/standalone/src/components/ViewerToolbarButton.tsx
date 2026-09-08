"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { ReactNode } from "react";

type ViewerToolbarButtonProps = {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  "aria-label": string;
};

/**
 * モニタリングアプリの ViewerToolbarTooltip ボタン相当（MUI 実装）。
 */
export function ViewerToolbarButton({
  active,
  icon,
  title,
  description,
  onClick,
  "aria-label": ariaLabel,
}: ViewerToolbarButtonProps) {
  return (
    <Tooltip
      placement="top"
      slotProps={{
        popper: { sx: { zIndex: 1001 } },
        tooltip: { sx: { maxWidth: "none" } },
      }}
      title={
        <Box sx={{ py: 0.25 }}>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: 14 }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", whiteSpace: "nowrap" }}>
            {description}
          </Typography>
        </Box>
      }
    >
      <Box
        component="button"
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 1,
          border: "1px solid",
          borderColor: active ? "#3b82f6" : "#374151",
          bgcolor: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
          color: active ? "#3b82f6" : "#ffffff",
          cursor: "pointer",
          transition: "all 0.15s ease",
          "&:hover": {
            borderColor: active ? "#3b82f6" : "#4b5563",
            bgcolor: active ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {icon}
      </Box>
    </Tooltip>
  );
}
