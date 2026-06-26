import { InsertDriveFile } from "@mui/icons-material";
import { FC } from "react";

const ICON_SIZE = 16;

export const PointCloudFileIcon: FC = () => {
  return <InsertDriveFile sx={{ fontSize: ICON_SIZE, color: "text.secondary", flexShrink: 0 }} />;
};
