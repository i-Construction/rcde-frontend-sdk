import { FC } from "react";
import { useClient } from "../contexts/client";
import { Viewer } from "./Viewer";

export type ContractDetailProps = {
  constructionId: number;
  contractId: number;
};

const ContractDetail: FC<ContractDetailProps> = ({
  constructionId,
  contractId,
}) => {
  return <Viewer constructionId={constructionId} contractId={contractId} />;
};

export { ContractDetail };
