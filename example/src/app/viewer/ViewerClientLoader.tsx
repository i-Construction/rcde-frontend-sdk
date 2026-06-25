"use client";

import dynamic from "next/dynamic";

const ViewerClient = dynamic(
  () => import("./ViewerClient").then((mod) => mod.ViewerClient),
  { ssr: false }
);

type ViewerClientLoaderProps = {
  token: string;
  constructionId: number;
  contractId: number;
  constructionName?: string;
  contractName?: string;
};

export function ViewerClientLoader(props: ViewerClientLoaderProps) {
  return <ViewerClient {...props} />;
}
