"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

type ThemeRegistryProps = {
  children: React.ReactNode;
};

export function ThemeRegistry({ children }: ThemeRegistryProps) {
  return <AppRouterCacheProvider>{children}</AppRouterCacheProvider>;
}
