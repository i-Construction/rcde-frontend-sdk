"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { CoordinateNumberInput } from "@/components/CoordinateNumberInput";
import { referencePointBridge, type ReferencePointCoordinates } from "@/lib/reference-point-bridge";

type ReferencePointDialogProps = {
  open: boolean;
  onClose: () => void;
};

type AxisKey = keyof ReferencePointCoordinates;

function isValidCoordinates(coordinates: ReferencePointCoordinates): boolean {
  return (
    Number.isFinite(coordinates.x) &&
    Number.isFinite(coordinates.y) &&
    Number.isFinite(coordinates.z)
  );
}

function CoordinateRow({
  label,
  value,
  onChange,
  onIncrement,
  onDecrement,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Typography sx={{ width: 20, fontSize: 14, fontWeight: 500 }}>{label}</Typography>
      <CoordinateNumberInput
        value={value}
        onChange={onChange}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    </Box>
  );
}

export function ReferencePointDialog({ open, onClose }: ReferencePointDialogProps) {
  const [coordinates, setCoordinates] = useState<ReferencePointCoordinates>({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setCoordinates(referencePointBridge.getCurrentPoint());
  }, [open]);

  const handleAxisChange = useCallback((axis: AxisKey, value: number) => {
    setCoordinates((prev) => ({ ...prev, [axis]: value }));
  }, []);

  const handleIncrement = useCallback((axis: AxisKey, step: number) => {
    setCoordinates((prev) => ({ ...prev, [axis]: prev[axis] + step }));
  }, []);

  const handleApply = useCallback(() => {
    if (!isValidCoordinates(coordinates)) {
      return;
    }
    referencePointBridge.apply(coordinates);
    onClose();
  }, [coordinates, onClose]);

  const isValid = isValidCoordinates(coordinates);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      slotProps={{
        paper: { sx: { maxWidth: 425 } },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>基準点設定</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <DialogContentText sx={{ mb: 2 }}>
          3D空間の基準点座標を設定します。
          <br />
          ビューアのカメラはこの位置にフォーカスされます。
        </DialogContentText>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <CoordinateRow
            label="X"
            value={coordinates.x}
            onChange={(value) => handleAxisChange("x", value)}
            onIncrement={() => handleIncrement("x", 1)}
            onDecrement={() => handleIncrement("x", -1)}
          />
          <CoordinateRow
            label="Y"
            value={coordinates.y}
            onChange={(value) => handleAxisChange("y", value)}
            onIncrement={() => handleIncrement("y", 1)}
            onDecrement={() => handleIncrement("y", -1)}
          />
          <CoordinateRow
            label="Z"
            value={coordinates.z}
            onChange={(value) => handleAxisChange("z", value)}
            onIncrement={() => handleIncrement("z", 1)}
            onDecrement={() => handleIncrement("z", -1)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 3, pb: 2 }}>
        <Button variant="outlined" size="small" onClick={onClose}>
          キャンセル
        </Button>
        <Button variant="contained" size="small" onClick={handleApply} disabled={!isValid}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
