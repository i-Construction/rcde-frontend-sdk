import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Modal,
  Typography,
} from "@mui/material";
import { FC, useCallback, useEffect, useState } from "react";
import { useClient } from "../../src/contexts/client";
import { RCDEClient } from "../../src/lib/rcde-client";
import { ConstructionForm } from "./ConstructionForm";
import { CreateConstructionSchema } from "../schemas/construction";

export type ConstructionListProps = {
  onSelect?: (id: number) => void;
};

const ConstructionList: FC<ConstructionListProps> = ({ onSelect }) => {
  const { client } = useClient();
  const [open, setOpen] = useState(false);
  const [constructions, setConstructions] = useState<
    Awaited<ReturnType<RCDEClient["getConstructionList"]>>["constructions"]
  >([]);

  const fetchConstructions = useCallback(() => {
    client?.getConstructionList().then((list) => {
      setConstructions(list.constructions);
    });
  }, [client]);

  useEffect(() => {
    fetchConstructions();
  }, [fetchConstructions]);

  const handleNewConstruction = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCreateConstruction = useCallback(
    (construction: CreateConstructionSchema) => {
      client?.createConstruction(construction).then(() => {
        fetchConstructions();
        setOpen(false);
      });
    },
    [client, fetchConstructions]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Box>
      {open ? (
        <Modal open={open} onClose={handleClose}>
          <Box
            width={400}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 8,
              px: 4,
            }}
          >
            <ConstructionForm onSubmit={handleCreateConstruction} />
          </Box>
        </Modal>
      ) : null}
      <List>
        <ListItem>
          <ListItemButton onClick={handleNewConstruction}>
            現場作成
          </ListItemButton>
        </ListItem>
        {constructions?.map((c) => {
          const { id } = c;
          return (
            <ListItem key={id}>
              <ListItemButton
                onClick={() => {
                  if (id !== undefined) {
                    onSelect?.(id);
                  }
                }}
              >
                <Box>
                  <Typography variant="body1">工事名称: {c.name}</Typography>
                  <Typography variant="caption">住所: {c.address}</Typography>
                  <Typography variant="body2">
                    契約日: {c.contractedAt}
                  </Typography>
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
    </Box>
  );
};

export { ConstructionList };
