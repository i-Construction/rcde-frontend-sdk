import { FormControl, FormLabel, TextField } from "@mui/material";
import { ChangeEvent, useCallback } from "react";

type FormItemKey = keyof PointCloudAttribute;
type FormItem = {
  label: string;
  key: keyof PointCloudAttribute;
};
const FORM_ITEMS: FormItem[] = [
  {
    label: "スキャン番号",
    key: "no",
  },
  {
    label: "取得時間",
    key: "time",
  },
  {
    label: "取得方法",
    key: "method",
  },
  {
    label: "利用機器",
    key: "equipment",
  },
  {
    label: "作業者",
    key: "person",
  },
  {
    label: "対象構造物",
    key: "crs",
  },
];

export type OnChangeParams = {
  key: FormItemKey;
  value: string;
};

export type PointCloudAttributeFormProps = {
  value: PointCloudAttribute | undefined;
  onChange?: (params: OnChangeParams) => void;
};

const PointCloudAttributeForm = ({
  value,
  onChange,
}: PointCloudAttributeFormProps) => {
  const handleChange = useCallback(
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      key: FormItemKey
    ) => {
      onChange?.({
        key,
        value: event.target.value,
      });
    },
    [onChange]
  );

  return (
    <FormControl
      sx={{
        marginBottom: 3,
        width: 1,
      }}
    >
      <FormLabel
        id="file-variant"
        sx={{
          fontWeight: "bold",
          marginBottom: 1,
        }}
      >
        施工現場情報
      </FormLabel>
      {FORM_ITEMS.map((item) => {
        return (
          <TextField
            key={`point-cloud-attribute-${item.key}`}
            id={`point-cloud-attribute-${item.key}`}
            size="small"
            label={item.label}
            value={value?.[item.key] ?? ""}
            onChange={(event) => handleChange(event, item.key)}
            sx={{
              marginBottom: 1,
            }}
          />
        );
      })}
    </FormControl>
  );
};

export { PointCloudAttributeForm };
