import { FC } from "react";
import { ContractFile, useClient } from "../contexts/client";

export type ContractFileProps = {
  file: ContractFile;
};

const ContractFileView: FC<ContractFileProps> = ({
}) => {
  const { client } = useClient();

  return <group>
  </group>;
};

export {
  ContractFileView
}