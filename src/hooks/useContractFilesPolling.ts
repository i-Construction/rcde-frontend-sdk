import { useEffect } from "react";
import type { ContractFile, RCDEClient } from "../lib/rcde-client";
import { needsPolling, type PendingUploads } from "../lib/contractFileStatus";

const POLLING_INTERVAL_MS = 3000;

type UseContractFilesPollingParams = {
  client: RCDEClient | undefined;
  contractId: number;
  contractFiles: ContractFile[];
  pendingUploads: PendingUploads;
  onFilesUpdated: (files: ContractFile[]) => void;
  enabled: boolean;
};

export function useContractFilesPolling(params: UseContractFilesPollingParams): void {
  const { client, contractId, contractFiles, pendingUploads, onFilesUpdated, enabled } = params;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (client === undefined) {
      return;
    }
    if (contractId === 0) {
      return;
    }

    const shouldContinuePolling = () => needsPolling(contractFiles, pendingUploads);
    if (!shouldContinuePolling()) {
      return;
    }

    const poll = async () => {
      try {
        const res = await client.getContractFileList({ contractId });
        onFilesUpdated(res.contractFiles);
      } catch (err) {
        console.warn("[useContractFilesPolling] getContractFileList failed:", err);
      }
    };

    poll();

    const intervalId = setInterval(() => {
      if (!shouldContinuePolling()) {
        clearInterval(intervalId);
        return;
      }
      poll();
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [client, contractId, contractFiles, pendingUploads, onFilesUpdated, enabled]);
}
