import { Box, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ja from 'date-fns/locale/ja';
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "../contexts/client";
import { ConstructionDetail } from "./ConstructionDetail";
import { ConstructionList } from "./ConstructionList";

interface Page<Variant extends string = string> {
  variant: Variant;
}

type ConstructionDetail = Page<"construction"> & {
  id: number;
};

type Pages = Page<"root"> | ConstructionDetail;

const Root: FC = () => {
  const [page, setPage] = useState<Pages>({ variant: "root" });
  const { client, initialize } = useClient();

  useEffect(() => {
    const clientId = "3cjrVuN6DUQIaKhXgGnbV91wKVZa9Sou";
    const clientSecret = "ZLyJ1Pawmw9WqWF5";
    const baseUrl = "http://localhost:8000";
    initialize({
      clientId,
      clientSecret,
      baseUrl,
    });
  }, []);

  const handleBack = useCallback(() => {
    switch (page.variant) {
      case "root": {
        break;
      }
      case "construction": {
        setPage({ variant: "root" });
      }
      default: {
        break;
      }
    }
  }, [page]);

  const p = useMemo(() => {
    switch (page.variant) {
      case "root": {
        return (
          <ConstructionList
            onSelect={(id) => {
              setPage({ variant: "construction", id });
            }}
          />
        );
      }
      case "construction": {
        return <ConstructionDetail id={page.id} />;
      }
      default: {
        return null;
      }
    }
  }, [page]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box>
        <Box>
          <Button
            fullWidth
            onClick={handleBack}
            disabled={page.variant === "root"}
          >
            戻る
          </Button>
        </Box>
        {p}
      </Box>
    </LocalizationProvider>
  );
};

export { Root };
