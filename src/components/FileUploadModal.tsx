import { Add } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  Typography,
} from "@mui/material";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useClient } from "../contexts/client";
import { ModalBox, ModalBoxProps } from "./ModalBox";
import { PointCloudAttributeForm } from "./PointCloudAttributeForm";
import { RCDEClient } from "../lib/rcde-client";

const POLLING_INTERVAL_MS = 3000;
const POLLING_MAX_ATTEMPTS = 60;

export type FileUploadModalProps = {
  contractId: number;
  onUploaded?: (
    res: Awaited<ReturnType<RCDEClient["uploadContractFile"]>>
  ) => void;
} & Omit<ModalBoxProps, "children">;

const FileUploadModal: FC<FileUploadModalProps> = (props) => {
  const { client } = useClient();

  const { contractId, onUploaded, ...rest } = props;
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [pointCloudAttribute, setPointCloudAttribute] =
    useState<PointCloudAttribute>({});

  const accept = useMemo(() => {
    return ".las,.laz,.csv,.txt,.xyz,.e57";
  }, []);

  const handleChangeFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files: fileList } = event.target;
      if (fileList !== null) {
        const inputFiles = Array.from(fileList);
        if (inputFiles.length > 10) {
          setErrorMessage("アップロードできるファイル数は10個までです");
          return;
        }
        setErrorMessage("");
        setFile(inputFiles[0]);
      }
    },
    []
  );

  // アップロード完了後、バックエンドの変換処理が終わるまでポーリングする
  const pollProcessingStatus = useCallback(
    async (contractFileId: number, uploadRes: Awaited<ReturnType<RCDEClient["uploadContractFile"]>>) => {
      setIsProcessing(true);
      let attempts = 0;
      const poll = async (): Promise<void> => {
        attempts += 1;
        const maxAttemptsReached = attempts >= POLLING_MAX_ATTEMPTS;
        if (maxAttemptsReached) {
          setIsProcessing(false);
          setErrorMessage("処理がタイムアウトしました。しばらくしてから再度お試しください。");
          return;
        }
        try {
          const statusRes = await client?.getContractFileProcessingStatus({
            contractId,
            contractFileId,
          });
          const isCompleted = statusRes?.status === "completed";
          if (isCompleted) {
            setIsProcessing(false);
            onUploaded?.(uploadRes);
            return;
          }
        } catch {
          // ステータス取得エラーは無視して再試行
        }
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
        return poll();
      };
      await poll();
    },
    [client, contractId, onUploaded]
  );

  const handleUpload = useCallback(() => {
    if (file !== null) {
      setIsUploading(true);
      setErrorMessage("");
      file
        .arrayBuffer()
        .then((buffer) => {
          return client?.uploadContractFile({
            contractId,
            name: file.name,
            buffer,
            pointCloudAttribute,
          });
        })
        .then((res) => {
          if (res !== undefined) {
            setIsUploading(false);
            const contractFileId = res.id as number;
            pollProcessingStatus(contractFileId, res);
          }
        })
        .catch((e) => {
          console.error(e);
          setErrorMessage("アップロードに失敗しました");
        })
        .finally(() => {
          setIsUploading(false);
        });
    }
  }, [contractId, client, file, pointCloudAttribute, pollProcessingStatus]);

  return (
    <ModalBox {...rest}>
      <Box
        component="div"
        sx={{
          width: 1,
          height: 1,
        }}
      >
        {isProcessing ? (
          <Box
            component="div"
            sx={{ width: 1, height: 1, flexDirection: "column" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
          >
            <CircularProgress size={32} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              点群データを処理しています…
            </Typography>
            <Typography variant="body2" color="text.secondary">
              変換が完了すると自動的に表示されます（数分かかる場合があります）
            </Typography>
          </Box>
        ) : !isUploading ? (
          <Box
            component="div"
            display="flex"
            flexDirection="column"
            gap={1}
            sx={{
              width: 1,
              height: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                marginBottom: 2,
              }}
            >
              ファイルをアップロードする
            </Typography>
            <FormControl>
              <FormLabel
                id="file-uploading"
                sx={{
                  fontWeight: "bold",
                  marginBottom: 1,
                }}
              >
                ファイルを選択する
              </FormLabel>
              <Button
                variant="outlined"
                startIcon={<Add />}
                sx={{
                  width: "auto",
                }}
                onClick={() => {
                  fileInput.current?.click();
                }}
              >
                ファイルを選択する
              </Button>
              <input
                multiple={false}
                type="file"
                accept={accept}
                onChange={handleChangeFile}
                style={{ display: "none" }}
                ref={fileInput}
              />
              <FormHelperText error>{errorMessage}</FormHelperText>
            </FormControl>
            {file !== null && (
              <Box width={1}>
                <Typography
                  variant="body1"
                  sx={{
                    marginRight: 1,
                  }}
                >
                  {file.name}
                </Typography>
                <PointCloudAttributeForm
                  value={pointCloudAttribute}
                  onChange={(params) => {
                    setPointCloudAttribute((prev) => ({
                      ...prev,
                      [params.key]: params.value,
                    }));
                  }}
                />
              </Box>
            )}
            <Box
              component="div"
              sx={{
                width: 1,
                marginTop: 1,
                textAlign: "right",
              }}
            >
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={file === null}
              >
                アップロードする
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            component="div"
            sx={{
              width: 1,
              height: 1,
              flexDirection: "column",
            }}
            display="flex"
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                marginBottom: 3,
              }}
            >
              ファイルをアップロードしています
            </Typography>
          </Box>
        )}
      </Box>
    </ModalBox>
  );
};

export { FileUploadModal };
