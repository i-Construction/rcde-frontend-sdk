import { FC, useEffect } from "react";
import { useClient } from "../contexts/client";
import { ContractFile } from "../contexts/contractFiles";

export type ContractFileProps = {
  file: ContractFile;
};

const ContractFileView: FC<ContractFileProps> = ({
  file,
}) => {
  const { client, project } = useClient();

  useEffect(() => {
    const { id } = file;
    if (project === undefined || id === undefined) return;
    client?.getContractFileMetadata({
      ...project,
      contractFileId: id,
    }).then((meta) => {
      console.log(meta);
    });
  }, [file, client, project]);

  return <group>
  </group>;
};

export {
  ContractFileView
}