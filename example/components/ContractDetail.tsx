import { FC } from "react";
import { RCDE, RCDEProps } from "../../src/components/RCDE";

const ContractDetail: FC<RCDEProps> = ({ app, constructionId, contractId }) => {
  return (
    <RCDE constructionId={constructionId} contractId={contractId} app={app} />
  );
};

export { ContractDetail };
