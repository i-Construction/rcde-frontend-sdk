"use client";

import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Box } from "@mui/material";

import { ViewerToolbarButton } from "@/components/ViewerToolbarButton";

const TOOLBAR_BACKGROUND = "#2d2d2d";

type ViewerBottomToolbarProps = {
  isReferencePointActive: boolean;
  onReferencePointClick: () => void;
};

/**
 * ビューワー下部中央に表示するツールバー（モニタリングアプリと同様の配置・見た目）。
 */
export function ViewerBottomToolbar({
  isReferencePointActive,
  onReferencePointClick,
}: ViewerBottomToolbarProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        borderRadius: 1,
        bgcolor: TOOLBAR_BACKGROUND,
        p: 0.5,
      }}
    >
      <ViewerToolbarButton
        active={isReferencePointActive}
        aria-label="基準点"
        title="基準点"
        description="基準点の位置を設定します"
        icon={<PlaceOutlinedIcon sx={{ fontSize: 20 }} />}
        onClick={onReferencePointClick}
      />
    </Box>
  );
}
