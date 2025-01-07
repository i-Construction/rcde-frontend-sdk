import {
  PngBuffer,
  pngParser,
  PointCloud,
  PointCloudLODLoader,
  PointCloudMeta
} from "pcd-viewer";
import { PNG } from "pngjs/browser";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { Box3, Vector3 } from "three";
import { useClient } from "../contexts/client";
import { ContractFile } from "../contexts/contractFiles";

export type ContractFileViewRef = {
  id: ContractFile['id'];
  boundingBox: Box3;
};

export type ContractFileProps = {
  file: ContractFile;
  referencePoint?: Vector3;
};

const ContractFileView = forwardRef<ContractFileViewRef, ContractFileProps>(({ file, referencePoint }, ref) => {
  const { client, project } = useClient();
  const [meta, setMeta] = useState<PointCloudMeta | undefined>(undefined);

  const setRef = useCallback((meta: PointCloudMeta) => {
    if (ref === null) return;
    const { min, max } = meta.bounds;
    const box = new Box3(new Vector3().fromArray(min), new Vector3().fromArray(max));
    const o = {
      id: file.id,
      boundingBox: box,
    };;
    if (ref !== null && typeof ref === 'function') {
      ref(o);
    } else if (ref !== null && typeof ref === 'object') {
      ref.current = o;
    }
  }, [ref, file]);

  useEffect(() => {
    const { id } = file;
    if (project === undefined || id === undefined) return;
    client
      ?.getContractFileMetadata({
        ...project,
        contractFileId: id,
      })
      .then((meta) => {
        const d = meta as unknown as PointCloudMeta;
        setMeta(d);
        setRef(d);
      });
  }, [file, client, project, setRef]);

  const loader: PointCloudLODLoader<PngBuffer> = useCallback(
    (props) => {
      const { address, color } = props;
      const { lod, coordinate } = address;
      // Construct the URL of the PNG file from the address.
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        const png = new PNG();
        const addr = `${coordinate.x}-${coordinate.y}-${coordinate.z}`;
        const props = {
          contractId: project!.contractId!,
          contractFileId: file.id!,
          level: lod,
          addr,
        };
        const pBuffer = await client?.getContractFileImagePosition(props);
        if (pBuffer === undefined) {
          reject(new Error("Failed to load PNG buffer"));
          return;
        }
        const pParsed = png.parse(pBuffer);
        pParsed.on("parsed", async () => {
          if (color) {
            const cBuffer = await client?.getContractFileImageColor(props);
            if (cBuffer === undefined) {
              reject(new Error("Failed to load PNG buffer"));
              return;
            }
            const png2 = new PNG();
            const cParsed = png2.parse(cBuffer);
            cParsed.on("parsed", () => {
              resolve({
                position: pParsed,
                color: cParsed,
              });
            });
          } else {
            resolve({
              position: pParsed,
            });
          }
        });
      });
    },
    [client, project, file]
  );

  return meta !== undefined ? (
    <PointCloud meta={meta} loader={loader} parser={pngParser} />
  ) : null;
});

export { ContractFileView };
