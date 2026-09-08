"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * shadcn/ui の sonner ラッパー。
 * monitoring-app では next-themes と連動させているが、本サンプルは
 * ライトモード固定のため CSS 変数のマッピングのみ行う。
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
