import { Add } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Typography,
} from "@mui/material";
import React, { FC, useCallback, useMemo, useRef, useState } from "react";
import { useClient } from "../contexts/client";
import { ModalBox, ModalBoxProps } from "./ModalBox";
import { PointCloudAttributeForm } from "./PointCloudAttributeForm";
import { RCDEClient } from "@i-con/api-sdk";

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

  const handleUpload = useCallback(() => {
    if (file !== null) {
      setIsUploading(true);
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
            onUploaded?.(res);
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          setIsUploading(false);
        });
    }
  }, [contractId, client, file, pointCloudAttribute, onUploaded]);

  return (
    <ModalBox {...rest}>
      <Box
        component="div"
        sx={{
          width: 1,
          height: 1,
        }}
      >
        {!isUploading ? (
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
