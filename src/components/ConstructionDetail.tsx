import { Box, List, ListItem, ListItemButton, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useClient } from "../contexts/client";
import { RCDEClient } from "@rcde/api-sdk";

export type ConstructionDetailProps = {
  id: number;
  onSelect?: (id: number) => void;
};

const ConstructionDetail: FC<ConstructionDetailProps> = ({
  id,
  onSelect
}) => {
  const { client } = useClient();
  const [contracts, setContracts] = useState<
    Awaited<ReturnType<RCDEClient["getContractList"]>>["contracts"]
  >([]);

  useEffect(() => {
    client?.getContractList({
      constructionId: id
    }).then((list) => {
      console.log(list);
      setContracts(list.contracts);
    });
  }, [client, id]);

  return (
    <List>
      {contracts?.map((c) => {
        const { id } = c;
        return (
          <ListItem key={id}>
            <ListItemButton onClick={() => {
              if (id !== undefined) {
                onSelect?.(id);
              }
            }}>
              <Box>
                <Typography variant="body1">契約名称: {c.name}</Typography>
                <Typography variant="body2">契約日: {c.contractedAt}</Typography>
                <Typography variant="body2">
                  状態: {c.status}
                </Typography>
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export { ConstructionDetail };
