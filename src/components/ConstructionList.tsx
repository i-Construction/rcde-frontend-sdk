import { Box, List, ListItem, ListItemButton, Typography } from "@mui/material";
import { FC, useEffect, useState } from "react";
import { useClient } from "../contexts/client";
import { RCDEClient } from "@rcde/api-sdk";

export type ConstructionListProps = {
  onSelect?: (id: number) => void;
};

const ConstructionList: FC<ConstructionListProps> = ({
  onSelect
}) => {
  const { client } = useClient();
  const [constructions, setConstructions] = useState<
    Awaited<ReturnType<RCDEClient["getConstructionList"]>>["constructions"]
  >([]);

  useEffect(() => {
    client?.getConstructionList().then((list) => {
      setConstructions(list.constructions);
    });
  }, [client]);

  return (
    <List>
      {constructions?.map((c) => {
        const { id } = c;
        return (
          <ListItem key={id}>
            <ListItemButton onClick={() => {
              if (id !== undefined) {
                onSelect?.(id);
              }
            }}>
              <Box>
                <Typography variant="body1">工事名称: {c.name}</Typography>
                <Typography variant="caption">住所: {c.address}</Typography>
                <Typography variant="body2">契約日: {c.contractedAt}</Typography>
                <Typography variant="body2">完成期日: {c.period}</Typography>
                <Typography variant="body2">
                  請負金額: ¥{c.contractAmount}
                </Typography>
                <Typography variant="body2">
                  前払い金額率:{c.advancePaymentRate}%
                </Typography>
              </Box>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export { ConstructionList };
