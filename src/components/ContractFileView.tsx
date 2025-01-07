import {
  PngBuffer,
  pngParser,
  PointCloud,
  PointCloudLODLoader,
  PointCloudMeta
} from "pcd-viewer";
import { PNG } from "pngjs/browser";
import { FC, useCallback, useEffect, useState } from "react";
import { Vector3 } from "three";
import { useClient } from "../contexts/client";
import { ContractFile } from "../contexts/contractFiles";

export type ContractFileProps = {
  file: ContractFile;
};

const ContractFileView: FC<ContractFileProps> = ({ file }) => {
  const { client, project } = useClient();
  const [meta, setMeta] = useState<PointCloudMeta | undefined>(undefined);
  const [offset, setOffset] = useState(new Vector3());

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
        const { min } = d.bounds;
        setMeta(d);
        setOffset(new Vector3().fromArray(min).negate());
      });
  }, [file, client, project]);

  const loader: PointCloudLODLoader<PngBuffer> = useCallback(
    (props) => {
      const { address, color } = props;
      const { lod, coordinate } = address;
      // Construct the URL of the PNG file from the address.
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

  return (
    <group position={offset}>
      {meta !== undefined ? (
        <PointCloud meta={meta} loader={loader} parser={pngParser} />
      ) : null}
    </group>
  );
};

export { ContractFileView };
