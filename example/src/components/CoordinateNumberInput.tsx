"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Box, IconButton, TextField } from "@mui/material";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from "react";

const REPEAT_INTERVAL_MS = 100;
const REPEAT_DELAY_MS = 300;

type CoordinateNumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

/**
 * モニタリングアプリの NumberInput に相当する座標入力（MUI + 上下ボタン）。
 */
export function CoordinateNumberInput({
  value,
  onChange,
  onIncrement,
  onDecrement,
}: CoordinateNumberInputProps) {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const commitValue = useCallback(() => {
    const parsed = Number.parseFloat(inputValue);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
      return;
    }
    setInputValue(String(value));
  }, [inputValue, onChange, value]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        commitValue();
        event.currentTarget.blur();
      }
    },
    [commitValue]
  );

  const handleRepeatMouseDown = useCallback((callback: () => void) => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const stop = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      document.removeEventListener("mouseup", stop);
    };

    callback();
    timeoutId = setTimeout(() => {
      intervalId = setInterval(callback, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
    document.addEventListener("mouseup", stop);
  }, []);

  return (
    <Box sx={{ position: "relative", flex: 1 }}>
      <TextField
        type="number"
        size="small"
        fullWidth
        value={inputValue}
        onChange={handleChange}
        onBlur={commitValue}
        onKeyDown={handleKeyDown}
        slotProps={{
          htmlInput: {
            style: { textAlign: "right", fontSize: 12, paddingRight: 28 },
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 32,
          },
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
            {
              WebkitAppearance: "none",
              margin: 0,
            },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          right: 2,
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <IconButton
          size="small"
          aria-label="増やす"
          onMouseDown={() => handleRepeatMouseDown(onIncrement)}
          sx={{ width: 20, height: 16, p: 0, color: "text.secondary" }}
        >
          <KeyboardArrowUpIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton
          size="small"
          aria-label="減らす"
          onMouseDown={() => handleRepeatMouseDown(onDecrement)}
          sx={{ width: 20, height: 16, p: 0, color: "text.secondary" }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
