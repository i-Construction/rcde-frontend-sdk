import {
  Box
} from "@mui/material";
import { FC } from "react";
import { useClient } from "../contexts/client";

export type ContractDetailProps = {
  constructionId: number;
  contractId: number;
};

const ContractDetail: FC<ContractDetailProps> = ({ }) => {
  const { client } = useClient();

  return (
    <Box>
    </Box>
  );
};

export { ContractDetail };
