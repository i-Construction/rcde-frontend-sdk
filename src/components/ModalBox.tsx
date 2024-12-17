import { Box, BoxProps, Modal, ModalProps } from "@mui/material";
import { FC } from "react";

export type ModalBoxProps = ModalProps & { boxSx?: BoxProps["sx"] };

const defaultBoxSx: BoxProps["sx"] = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxHeight: "calc(100% - 40px)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 12,
  borderRadius: 4,
  p: 4,
  overflowY: "auto",
};

const ModalBox: FC<ModalBoxProps> = (props) => {
  const { children, boxSx, ...rest } = props;
  return (
    <Modal {...rest}>
      <Box component="div" sx={{ ...defaultBoxSx, ...boxSx }}>
        {children}
      </Box>
    </Modal>
  );
};

export { ModalBox };
