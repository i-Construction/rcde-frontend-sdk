import type { Metadata } from "next";

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
      <body style={{ margin: 0, fontFamily: "sans-serif" }}>{children}</body>
    </html>
  );
}
