import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Modal,
  Typography
} from "@mui/material";
import { RCDEClient } from "@i-con/api-sdk";
import { FC, useCallback, useEffect, useState } from "react";
import { useClient } from "../contexts/client";
import { CreateContractSchema } from "../schemas/contract";
import { ContractForm } from "./ContractForm";

export type ConstructionDetailProps = {
  id: number;
  onSelect?: (props: { constructionId: number; contractId: number }) => void;
};

const ConstructionDetail: FC<ConstructionDetailProps> = ({ id: constructionId, onSelect }) => {
  const { client } = useClient();
  const [open, setOpen] = useState(false);

  const [construction, setConstruction] = useState<Awaited<
    ReturnType<RCDEClient["getConstruction"]>
  > | null>(null);
  const [contracts, setContracts] = useState<
    Awaited<ReturnType<RCDEClient["getContractList"]>>["contracts"]
  >([]);

  useEffect(() => {
    client?.getConstruction(constructionId).then((c) => {
      setConstruction(c);
    });
  }, [client, constructionId]);

  const fetchContracts = useCallback(() => {
    client
      ?.getContractList({
        constructionId: constructionId,
      })
      .then((list) => {
        setContracts(list.contracts);
      });
  }, [client, constructionId]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleNewContract = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleCreateContract = useCallback(
    (contract: CreateContractSchema) => {
      client
        ?.createContract({
          constructionId: constructionId,
          ...contract,
        })
        .then(() => {
          fetchContracts();
          setOpen(false);
        });
    },
    [constructionId, client, fetchContracts]
  );

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
            <ContractForm onSubmit={handleCreateContract} />
          </Box>
        </Modal>
      ) : null}
      <List>
        <ListItem>
          <Typography variant="body1">
            工事名称: {construction?.name}
          </Typography>
        </ListItem>
        <ListItem>
          <ListItemButton onClick={handleNewContract}>契約作成</ListItemButton>
        </ListItem>
        {contracts?.map((c) => {
          const { id } = c;
          return (
            <ListItem key={id}>
              <ListItemButton
                onClick={() => {
                  if (id !== undefined) {
                    onSelect?.({ constructionId, contractId: id });
                  }
                }}
              >
                <Box>
                  <Typography variant="body1">契約名称: {c.name}</Typography>
                  <Typography variant="body2">
                    契約日: {c.contractedAt}
                  </Typography>
                  <Typography variant="body2">状態: {c.status}</Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export { ConstructionDetail };
