import { Box, Button } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import ja from "date-fns/locale/ja";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "../../src/contexts/client";
import { ConstructionDetail } from "./ConstructionDetail";
import { ConstructionList } from "./ConstructionList";
import { ContractDetail } from "./ContractDetail";

interface Page<Variant extends string = string> {
  variant: Variant;
}

type ConstructionDetail = Page<"construction"> & {
  constructionId: number;
};

type ContractDetail = Page<"contract"> & {
  constructionId: number;
  contractId: number;
};

type Pages = Page<"root"> | ConstructionDetail | ContractDetail;

const Root: FC = () => {
  const [page, setPage] = useState<Pages>({ variant: "root" });
  const { initialize } = useClient();

  const app = useMemo(() => {
    return {
      clientId: import.meta.env.VITE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_CLIENT_SECRET,
      baseUrl: import.meta.env.VITE_API_BASE_URL,
    };
  }, []);

  useEffect(() => {
    initialize(app);
  }, [app, initialize]);

  const handleBack = useCallback(() => {
    switch (page.variant) {
      case "root": {
        break;
      }
      case "construction": {
        setPage({ variant: "root" });
        break;
      }
      case "contract": {
        setPage({
          variant: "construction",
          constructionId: page.constructionId,
        });
        break;
      }
      default: {
        break;
      }
    }
  }, [page]);

  const handleSelectContract = useCallback(
    (props: { constructionId: number; contractId: number }) => {
      setPage({ variant: "contract", ...props });
    },
    []
  );

  const p = useMemo(() => {
    switch (page.variant) {
      case "root": {
        return (
          <ConstructionList
            onSelect={(constructionId) => {
              setPage({ variant: "construction", constructionId });
            }}
          />
        );
      }
      case "construction": {
        return (
          <ConstructionDetail
            id={page.constructionId}
            onSelect={handleSelectContract}
          />
        );
      }
      case "contract": {
        return (
          <ContractDetail
            app={app}
            constructionId={page.constructionId}
            contractId={page.contractId}
          />
        );
      }
      default: {
        return null;
      }
    }
  }, [page, app, handleSelectContract]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Box width={1} height={1} display="flex" flexDirection={"column"}>
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
