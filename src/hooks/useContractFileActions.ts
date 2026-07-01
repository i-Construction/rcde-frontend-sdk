import { useCallback } from "react";
import { useClient } from "../contexts/client";
import {
  ContractFile,
  ContractFileContainer,
  useContractFiles,
} from "../contexts/contractFiles";
import { useReferencePoint } from "../contexts/referencePoint";

export type UseContractFileActionsOptions = {
  onFileDelete?: (file: ContractFile) => void;
};

export const useContractFileActions = (options: UseContractFileActionsOptions = {}) => {
  const { onFileDelete } = options;
  const { client, project } = useClient();
  const { containers, toggleVisibility } = useContractFiles();
  const { focusFileById } = useReferencePoint();

  const toggleContractFileVisibility = useCallback(
    (container: ContractFileContainer) => {
      toggleVisibility(container);
    },
    [toggleVisibility]
  );

  const focusContractFile = useCallback(
    async (file: ContractFile) => {
      if (file.id === undefined) return;
      await focusFileById(file.id);
    },
    [focusFileById]
  );

  const downloadContractFile = useCallback(
    async (file: ContractFile) => {
      const { id } = file;
      if (project === undefined || id === undefined) return;

      const res = await client?.getContractFileDownloadUrl(project.contractId, id);
      const { presignedURL } = res ?? {};
      if (presignedURL === undefined) return;

      window.open(presignedURL, "_blank");
    },
    [client, project]
  );

  const deleteContractFile = useCallback(
    (file: ContractFile) => {
      onFileDelete?.(file);
    },
    [onFileDelete]
  );

  return {
    containers,
    toggleContractFileVisibility,
    focusContractFile,
    downloadContractFile,
    deleteContractFile,
  };
};
