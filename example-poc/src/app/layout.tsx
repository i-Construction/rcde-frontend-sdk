import type { Metadata } from "next";
import { ThemeRegistry } from "@/components/ThemeRegistry";

export const metadata: Metadata = {
  title: "RCDE PoC Viewer",
  description: "RCDE Frontend SDK PoC Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
