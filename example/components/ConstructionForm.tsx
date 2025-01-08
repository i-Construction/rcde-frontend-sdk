import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import React, { FC, useCallback, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  CreateConstructionSchema,
  createConstructionSchema,
} from "../schemas/construction";

export type ConstructionFormProps = {
  onSubmit: (values: CreateConstructionSchema) => void;
};

const ConstructionForm: FC<ConstructionFormProps> = ({
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
  } = useForm<CreateConstructionSchema>({
    resolver: zodResolver(createConstructionSchema),
    mode: "onChange",
  });

  const submitHandler: SubmitHandler<CreateConstructionSchema> = useCallback(
    (values) => {
      onSubmit(values);
      setLoading(true);
    },
    [onSubmit]
  );

  const items = useMemo(
    () => [
      {
        label: "工事名称",
        key: "name",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            type="text"
            error={!!errors.name}
            helperText={errors.name && errors.name.message}
            {...register("name")}
          />
        ),
      },
      {
        label: "住所",
        key: "address",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            type="text"
            error={!!errors.address}
            helperText={errors.address && errors.address.message}
            {...register("address")}
          />
        ),
      },
      {
        label: "契約日",
        key: "contractedAt",
        required: true,
        component: (
          <Controller
            name="contractedAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!errors.contractedAt,
                    helperText:
                      errors.contractedAt && errors.contractedAt.message,
                  },
                }}
                onChange={(value: Date | null) =>
                  value === null
                    ? field.onChange(undefined)
                    : field.onChange(value)
                }
              />
            )}
          />
        ),
      },
      {
        label: "完成期日",
        key: "period",
        required: true,
        component: (
          <Controller
            name="period"
            control={control}
            render={({ field }) => (
              <DatePicker
                {...field}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!errors.period,
                    helperText: errors.period && errors.period.message,
                  },
                }}
                onChange={(value: Date | null) =>
                  value === null
                    ? field.onChange(undefined)
                    : field.onChange(value)
                }
              />
            )}
          />
        ),
      },
      {
        label: "請負金額",
        key: "contractAmount",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            type="number"
            InputProps={{
              inputProps: { inputMode: "numeric", pattern: "[0-9]*", min: 0 },
              startAdornment: "¥",
            }}
            error={!!errors.contractAmount}
            helperText={errors.contractAmount && errors.contractAmount.message}
            {...register("contractAmount", {
              valueAsNumber: true,
            })}
          />
        ),
      },
      {
        label: "前払い金額率",
        key: "advancePaymentRate",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            type="number"
            InputProps={{
              inputProps: { inputMode: "numeric", pattern: "[0-9]*", min: 0 },
              endAdornment: "%",
            }}
            error={!!errors.advancePaymentRate}
            helperText={
              errors.advancePaymentRate && errors.advancePaymentRate.message
            }
            {...register("advancePaymentRate", {
              valueAsNumber: true,
            })}
          />
        ),
      },
    ],
    [
      control,
      errors.address,
      errors.advancePaymentRate,
      errors.contractAmount,
      errors.contractedAt,
      errors.name,
      errors.period,
      register,
    ]
  );

  return (
    <Box>
      <List component="form" onSubmit={handleSubmit(submitHandler)}>
        {items.map((item) => {
          return (
            <ListItem key={item.key}>
              <Box display="flex" width={1}>
                <Box
                  display={"flex"}
                  alignItems={"center"}
                  marginRight={2}
                  minWidth={100}
                >
                  <Typography variant="caption">{item.label}</Typography>
                </Box>
                {item.component}
              </Box>
            </ListItem>
          );
        })}
        <ListItem>
          <Button
            type="submit"
            variant="contained"
            style={{ width: "100%" }}
            disabled={!isValid || isSubmitting || loading}
          >
            現場を作成する
          </Button>
        </ListItem>
      </List>
    </Box>
  );
};

export { ConstructionForm };
