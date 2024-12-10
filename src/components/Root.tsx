import { Box, Button } from "@mui/material";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "../contexts/client";
import { ConstructionList } from "./ConstructionList";
import { ConstructionDetail } from "./ConstructionDetail";

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
    const clientId = "VbATMQpPvL4u1CunoH07d5X5NZLrDHgO";
    const clientSecret = "xCoz4aLSvp8IDAal";
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
  );
};

export { Root };
