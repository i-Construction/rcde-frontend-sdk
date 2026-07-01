import { AccessTime, CheckCircle, CloudUpload, Sync } from "@mui/icons-material";
import { Box, Popover, Typography } from "@mui/material";
import { FC } from "react";
import type { PclodStatusLabel, UploadStatusLabel } from "../../lib/contractFileStatus";
import { isFileStatusActive } from "../../lib/contractFileStatus";
import { PointCloudFileIcon } from "./PointCloudFileIcon";

type FileStatusIconProps = {
  uploadStatus: UploadStatusLabel;
  pclodStatus: PclodStatusLabel;
  isPclodCompleted: boolean;
  isHovered: boolean;
  anchorEl: HTMLElement | null;
};

function PclodLabelChip() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        width: 80,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 0.5,
        px: 0.75,
        py: 0.25,
        fontSize: 12,
        color: "common.black",
        bgcolor: "#808000",
      }}
    >
      PCLOD処理
    </Box>
  );
}

function UploadLabelChip() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        width: 80,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 0.5,
        px: 0.75,
        py: 0.25,
        fontSize: 12,
        color: "common.black",
        bgcolor: "info.light",
      }}
    >
      アップロード
    </Box>
  );
}

function PclodStatusDisplay({ status }: { status: PclodStatusLabel }) {
  const iconSx = { fontSize: 16 };
  if (status === "完了") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
      >
        <CheckCircle sx={{ ...iconSx, color: "success.main" }} />
        <Typography component="span" variant="caption" color="common.white">
          {status}
        </Typography>
      </Box>
    );
  }
  if (status === "処理中") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
      >
        <CloudUpload sx={{ ...iconSx, color: "info.main" }} />
        <Typography component="span" variant="caption" color="common.white">
          {status}
        </Typography>
      </Box>
    );
  }
  if (status === "待機中") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
      >
        <AccessTime sx={{ ...iconSx, color: "warning.main" }} />
        <Typography component="span" variant="caption" color="common.white">
          {status}
        </Typography>
      </Box>
    );
  }
  return (
    <Typography component="span" variant="caption" color="common.white">
      {status}
    </Typography>
  );
}

function UploadStatusDisplay({ status }: { status: UploadStatusLabel }) {
  const iconSx = { fontSize: 16 };
  if (status === "完了") {
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
      >
        <CheckCircle sx={{ ...iconSx, color: "success.main" }} />
        <Typography component="span" variant="caption" color="common.white">
          {status}
        </Typography>
      </Box>
    );
  }
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
    >
      <CloudUpload sx={{ ...iconSx, color: "info.main" }} />
      <Typography component="span" variant="caption" color="common.white">
        {status}
      </Typography>
    </Box>
  );
}

function StatusIcon({
  uploadStatus,
  pclodStatus,
  isPclodCompleted,
}: {
  uploadStatus: UploadStatusLabel;
  pclodStatus: PclodStatusLabel;
  isPclodCompleted: boolean;
}) {
  const labels = { upload: uploadStatus, pclod: pclodStatus };
  const isActive = isFileStatusActive(labels);

  if (isActive) {
    return (
      <Sync
        sx={{
          fontSize: 16,
          color: "text.primary",
          animation: "spin 1s linear infinite",
          "@keyframes spin": {
            from: { transform: "rotate(0deg)" },
            to: { transform: "rotate(360deg)" },
          },
        }}
      />
    );
  }

  if (pclodStatus === "待機中") {
    return <AccessTime sx={{ fontSize: 16, color: "warning.main" }} />;
  }

  if (isPclodCompleted) {
    return <PointCloudFileIcon />;
  }

  return <AccessTime sx={{ fontSize: 16, color: "warning.main" }} />;
}

const FileStatusIcon: FC<FileStatusIconProps> = (props) => {
  const { uploadStatus, pclodStatus, isPclodCompleted, isHovered, anchorEl } = props;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        minWidth: 16,
        flexShrink: 0,
      }}
    >
      <StatusIcon
        uploadStatus={uploadStatus}
        pclodStatus={pclodStatus}
        isPclodCompleted={isPclodCompleted}
      />
      <Popover
        open={isHovered}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        disableRestoreFocus
        sx={{ pointerEvents: "none" }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: "none",
              bgcolor: "grey.900",
              color: "common.white",
              p: 1.5,
              ml: 0.5,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PclodLabelChip />
            <PclodStatusDisplay status={pclodStatus} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <UploadLabelChip />
            <UploadStatusDisplay status={uploadStatus} />
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export { FileStatusIcon };
