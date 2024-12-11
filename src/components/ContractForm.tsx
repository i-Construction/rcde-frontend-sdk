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
import { FC, useCallback, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { createConstructionSchema } from "../schemas/construction";
import { CreateContractSchema } from "../schemas/contract";

export type ContractFormProps = {
  onSubmit: (values: CreateContractSchema) => void;
};

const ContractForm: FC<ContractFormProps> = ({ onSubmit }) => {
  const [loading, setLoading] = useState(false);

  const {
    control,
    register,
    formState: { errors, isValid, isSubmitting },
    handleSubmit,
  } = useForm<CreateContractSchema>({
    resolver: zodResolver(createConstructionSchema),
    mode: "onChange",
  });

  const submitHandler: SubmitHandler<CreateContractSchema> = useCallback(
    (values) => {
      onSubmit(values);
      setLoading(true);
    },
    [onSubmit]
  );

  const items = useMemo(
    () => [
      {
        label: "契約項目名",
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
        label: "管理者メールアドレス",
        key: "contractAmount",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            error={!!errors.email}
            helperText={errors.email && errors.email.message}
            {...register("email", {})}
          />
        ),
      },
      {
        label: "単価",
        key: "unitPrice",
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
            error={!!errors.unitPrice}
            helperText={errors.unitPrice && errors.unitPrice.message}
            {...register("unitPrice", {
              valueAsNumber: true,
            })}
          />
        ),
      },
      {
        label: "契約数量",
        key: "unitVolume",
        required: true,
        component: (
          <TextField
            size="small"
            fullWidth
            autoComplete="off"
            type="number"
            InputProps={{
              inputProps: { inputMode: "numeric", pattern: "[0-9]*", min: 0 },
            }}
            error={!!errors.unitVolume}
            helperText={errors.unitVolume && errors.unitVolume.message}
            {...register("unitVolume", {
              valueAsNumber: true,
            })}
          />
        ),
      },
    ],
    [control, errors, register]
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
            契約を作成する
          </Button>
        </ListItem>
      </List>
    </Box>
  );
};

export { ContractForm };
