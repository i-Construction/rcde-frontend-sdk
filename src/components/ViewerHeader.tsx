import { NavigateNext, ViewSidebar } from "@mui/icons-material";
import {
  AppBar,
  Box,
  Breadcrumbs,
  IconButton,
  Link,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { FC } from "react";

export type ViewerHeaderProps = {
  /** アプリケーション名（デフォルト: "RCDE Viewer"） */
  appName?: string;
  /** 現場名 */
  constructionName?: string;
  /** 契約名 */
  contractName?: string;
  /** 左サイドバーの開閉状態 */
  sidebarOpen?: boolean;
  /** 左サイドバートグルのコールバック */
  onSidebarToggle?: () => void;
  /** ヘッダー右側に追加で表示する要素 */
  rightContent?: React.ReactNode;
};

const HEADER_HEIGHT = 48;

const BreadcrumbItem: FC<{ label: string; isLast?: boolean }> = ({
  label,
  isLast,
}) => {
  const sx = {
    fontSize: "0.8125rem",
    lineHeight: 1.4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: 200,
  };

  const isLastItem = isLast ?? false;
  if (isLastItem) {
    return (
      <Tooltip title={label} disableInteractive>
        <Typography
          variant="body2"
          sx={{ ...sx, color: "rgba(255,255,255,0.95)", fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Tooltip>
    );
  }
  return (
    <Tooltip title={label} disableInteractive>
      <Link
        underline="hover"
        sx={{ ...sx, color: "rgba(255,255,255,0.6)", cursor: "default" }}
      >
        {label}
      </Link>
    </Tooltip>
  );
};

/**
 * ビューアのトップヘッダー。
 * モニタリングアプリに準じたダークヘッダー + アプリ名/現場名/契約名のパンくずリスト。
 */
const ViewerHeader: FC<ViewerHeaderProps> = ({
  appName = "RCDE Viewer",
  constructionName,
  contractName,
  sidebarOpen,
  onSidebarToggle,
  rightContent,
}) => {
  const breadcrumbItems: { label: string; isLast: boolean }[] = [];

  breadcrumbItems.push({ label: appName, isLast: !constructionName && !contractName });

  if (constructionName) {
    breadcrumbItems.push({
      label: constructionName,
      isLast: !contractName,
    });
  }
  if (contractName) {
    breadcrumbItems.push({ label: contractName, isLast: true });
  }

  return (
    <AppBar
      position="relative"
      elevation={0}
      sx={{
        bgcolor: "#166534",
        color: "white",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        height: HEADER_HEIGHT,
        flexShrink: 0,
      }}
    >
      <Toolbar
        variant="dense"
        sx={{ minHeight: HEADER_HEIGHT, height: HEADER_HEIGHT, px: 1, gap: 0.5 }}
      >
        {/* サイドバートグルボタン（モニタリングアプリと同様にヘッダー左端） */}
        {onSidebarToggle && (
          <>
            <Tooltip title={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}>
              <IconButton
                size="small"
                color="inherit"
                onClick={onSidebarToggle}
                sx={{
                  width: 32,
                  height: 32,
                  color: "white",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                <ViewSidebar />
              </IconButton>
            </Tooltip>
            {/* 区切り線 */}
            <Box
              sx={{
                width: 1,
                height: 20,
                bgcolor: "rgba(255,255,255,0.2)",
                mx: 0.5,
                flexShrink: 0,
              }}
            />
          </>
        )}

        {/* パンくずリスト */}
        <Box flex={1} overflow="hidden">
          <Breadcrumbs
            separator={
              <NavigateNext
                sx={{ fontSize: 16, color: "rgba(255,255,255,0.35)" }}
              />
            }
            sx={{
              "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
              "& .MuiBreadcrumbs-li": { overflow: "hidden" },
            }}
          >
            {breadcrumbItems.map((item, i) => (
              <BreadcrumbItem key={i} label={item.label} isLast={item.isLast} />
            ))}
          </Breadcrumbs>
        </Box>

        {/* 右側コンテンツ（外部から挿入可能） */}
        {rightContent && (
          <Box display="flex" alignItems="center" gap={1} ml={2}>
            {rightContent}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export { ViewerHeader, HEADER_HEIGHT };
