"use client";

import type { ReactNode } from "react";
import { ClientProvider, ContractFilesProvider, ReferencePointProvider } from "@i-con/frontend-sdk";

/**
 * SDK が公開する 3 つのプロバイダを自前で構成する。
 *
 * `RCDE` コンポーネントはこの 3 つを内包しているが、その場合サイドバーは
 * `auxiliaryContent`（キャンバスへの重ね描き）にしか置けない。ビューアとサイドバーを
 * 横並びにしたいので、ここでは `Viewer` を直接使い、プロバイダを自前で並べている。
 *
 * 依存順に注意: `ReferencePointProvider` は内部で `useClient` と `useContractFiles` を
 * 呼ぶため、必ずその 2 つより内側に置く。
 */
export function ViewerProviders({ children }: { children: ReactNode }) {
  return (
    <ClientProvider>
      <ContractFilesProvider>
        <ReferencePointProvider>{children}</ReferencePointProvider>
      </ContractFilesProvider>
    </ClientProvider>
  );
}
