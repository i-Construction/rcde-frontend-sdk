export type PointCloudUploadRequest = {
  contractId: number;
  name: string;
  size: number;
  pointCloudAttribute: Record<string, unknown>;
};

export function buildPointCloudUploadRequest(params: {
  contractId: number;
  name: string;
  buffer: ArrayBuffer;
  pointCloudAttribute?: Record<string, unknown>;
}): PointCloudUploadRequest {
  const { contractId, name, buffer, pointCloudAttribute } = params;
  return {
    contractId,
    name,
    size: buffer.byteLength,
    pointCloudAttribute: pointCloudAttribute ?? {},
  };
}

export type PresignedFileUpload = {
  method: "PUT";
  body: ArrayBuffer;
};

export function buildPresignedFileUpload(buffer: ArrayBuffer): PresignedFileUpload {
  return {
    method: "PUT",
    body: buffer,
  };
}

export function buildUploadCompleteRequest(contractId: number): { contractId: number } {
  return { contractId };
}

export function buildStartApiFetchInit(
  uploadRequest: PointCloudUploadRequest,
  headers: Record<string, string>
): { method: "POST"; headers: Record<string, string>; body: string } {
  return {
    method: "POST",
    headers,
    body: JSON.stringify(uploadRequest),
  };
}

export function buildCompleteApiFetchInit(
  contractId: number,
  headers: Record<string, string>
): { method: "PUT"; headers: Record<string, string>; body: string } {
  return {
    method: "PUT",
    headers,
    body: JSON.stringify(buildUploadCompleteRequest(contractId)),
  };
}

export type PointCloudUploadParams = {
  contractId: number;
  name: string;
  buffer: ArrayBuffer;
  pointCloudAttribute?: Record<string, unknown>;
  onContractFileCreated?: (contractFileId: number) => void;
};

export type PointCloudUploadDeps = {
  getApiPath: (segment: string) => string;
  fetchImpl: typeof fetch;
  getAuthHeaders: () => Record<string, string>;
};

export const DEFAULT_CHUNK_SIZE_BYTES = 100 * 1024 * 1024;

export function calculatePartTotal(fileSize: number, chunkSize: number): number {
  return Math.ceil(fileSize / chunkSize);
}

export function getBufferChunk(
  buffer: ArrayBuffer,
  partIndex: number,
  chunkSize: number
): ArrayBuffer {
  const start = partIndex * chunkSize;
  const end = Math.min(start + chunkSize, buffer.byteLength);
  return buffer.slice(start, end);
}

export type PointCloudMultipartUploadRequest = PointCloudUploadRequest & {
  partTotal: number;
};

export function buildPointCloudMultipartUploadRequest(params: {
  contractId: number;
  name: string;
  buffer: ArrayBuffer;
  chunkSize: number;
  pointCloudAttribute?: Record<string, unknown>;
}): PointCloudMultipartUploadRequest {
  const { contractId, name, buffer, chunkSize, pointCloudAttribute } = params;
  return {
    ...buildPointCloudUploadRequest({ contractId, name, buffer, pointCloudAttribute }),
    partTotal: calculatePartTotal(buffer.byteLength, chunkSize),
  };
}

export type S3UploadPart = {
  partNumber: number;
  etag: string;
};

export function buildS3PartsFromUploadResults(
  results: { partNumber: number; etag: string }[]
): S3UploadPart[] {
  return results.map(({ partNumber, etag }) => ({ partNumber, etag }));
}

export function buildCompleteMultipartUploadRequest(params: {
  contractFileId: number;
  s3UploadId: string;
  s3Parts: S3UploadPart[];
  blockChainUploadId: string;
}): {
  contractFileId: number;
  s3UploadId: string;
  s3Parts: S3UploadPart[];
  blockChainUploadId: string;
} {
  return {
    contractFileId: params.contractFileId,
    s3UploadId: params.s3UploadId,
    s3Parts: params.s3Parts,
    blockChainUploadId: params.blockChainUploadId,
  };
}

export function buildDeleteMultipartUploadRequest(params: {
  contractFileId: number;
  s3UploadId: string;
  blockChainUploadId: string;
}): {
  contractFileId: number;
  s3UploadId: string;
  blockChainUploadId: string;
} {
  return {
    contractFileId: params.contractFileId,
    s3UploadId: params.s3UploadId,
    blockChainUploadId: params.blockChainUploadId,
  };
}

export function buildMultipartStartApiFetchInit(
  uploadRequest: PointCloudMultipartUploadRequest,
  headers: Record<string, string>
): { method: "POST"; headers: Record<string, string>; body: string } {
  return {
    method: "POST",
    headers,
    body: JSON.stringify(uploadRequest),
  };
}

export function buildCompleteMultipartApiFetchInit(
  request: ReturnType<typeof buildCompleteMultipartUploadRequest>,
  headers: Record<string, string>
): { method: "PUT"; headers: Record<string, string>; body: string } {
  return {
    method: "PUT",
    headers,
    body: JSON.stringify(request),
  };
}

export function buildDeleteMultipartApiFetchInit(
  request: ReturnType<typeof buildDeleteMultipartUploadRequest>,
  headers: Record<string, string>
): { method: "DELETE"; headers: Record<string, string>; body: string } {
  return {
    method: "DELETE",
    headers,
    body: JSON.stringify(request),
  };
}

export type PointCloudMultipartUploadParams = PointCloudUploadParams & {
  chunkSize?: number;
  onUploadProgress?: (completedParts: number, totalParts: number) => void;
};

type MultipartUploadStartResponse = {
  contractFileId: number;
  s3UploadId: string;
  presignedUploadParts: { partNumber: number; presignedURL: string }[];
  blockChainUploadId: string;
  blockChainUploadURLs: string[];
};

async function deleteMultipartUpload(
  deps: PointCloudUploadDeps,
  params: { contractFileId: number; s3UploadId: string; blockChainUploadId: string }
): Promise<void> {
  const { getApiPath, fetchImpl, getAuthHeaders } = deps;
  const deleteUrl = getApiPath("/contractFile/pointCloud/deleteMultipartUpload");
  const deleteRequest = buildDeleteMultipartUploadRequest(params);
  await fetchImpl(deleteUrl, buildDeleteMultipartApiFetchInit(deleteRequest, getAuthHeaders()));
}

export async function uploadPointCloudFileMultipart(
  deps: PointCloudUploadDeps,
  params: PointCloudMultipartUploadParams
): Promise<{ contractFileId: number }> {
  const { contractId, name, buffer, pointCloudAttribute, chunkSize, onUploadProgress } = params;
  const { getApiPath, fetchImpl, getAuthHeaders } = deps;

  const resolvedChunkSize = chunkSize ?? DEFAULT_CHUNK_SIZE_BYTES;
  const partTotal = calculatePartTotal(buffer.byteLength, resolvedChunkSize);

  const startUrl = getApiPath("/contractFile/pointCloud/multipartUpload");
  const uploadRequest = buildPointCloudMultipartUploadRequest({
    contractId,
    name,
    buffer,
    chunkSize: resolvedChunkSize,
    pointCloudAttribute,
  });
  const startRes = await fetchImpl(
    startUrl,
    buildMultipartStartApiFetchInit(uploadRequest, getAuthHeaders())
  );
  if (!startRes.ok) throw new Error(`HTTP ${startRes.status}`);

  const startData = (await startRes.json()) as MultipartUploadStartResponse;
  const {
    contractFileId,
    s3UploadId,
    presignedUploadParts,
    blockChainUploadId,
    blockChainUploadURLs,
  } = startData;

  if (params.onContractFileCreated !== undefined) {
    params.onContractFileCreated(contractFileId);
  }

  let completedParts = 0;

  try {
    const uploadResults = await Promise.all(
      presignedUploadParts.map(async (presignedUploadPart, index) => {
        const chunk = getBufferChunk(buffer, index, resolvedChunkSize);

        const s3Res = await fetchImpl(presignedUploadPart.presignedURL, {
          method: "PUT",
          body: chunk,
        });
        if (!s3Res.ok) throw new Error(`Upload failed: HTTP ${s3Res.status}`);

        const etag = s3Res.headers.get("etag") ?? "";
        const blockChainUrl = blockChainUploadURLs[index];
        const formData = new FormData();
        formData.append("file", new Blob([chunk]));

        const blockChainRes = await fetchImpl(blockChainUrl, {
          method: "PUT",
          body: formData,
        });
        if (!blockChainRes.ok) throw new Error(`Upload failed: HTTP ${blockChainRes.status}`);

        completedParts += 1;
        if (onUploadProgress !== undefined) {
          onUploadProgress(completedParts, partTotal);
        }

        return { partNumber: presignedUploadPart.partNumber, etag };
      })
    );

    const s3Parts = buildS3PartsFromUploadResults(uploadResults);
    const completeUrl = getApiPath("/contractFile/pointCloud/completeMultipartUpload");
    const completeRequest = buildCompleteMultipartUploadRequest({
      contractFileId,
      s3UploadId,
      s3Parts,
      blockChainUploadId,
    });
    const completeRes = await fetchImpl(
      completeUrl,
      buildCompleteMultipartApiFetchInit(completeRequest, getAuthHeaders())
    );
    if (!completeRes.ok)
      throw new Error(`Complete multipart upload failed: HTTP ${completeRes.status}`);

    return { contractFileId };
  } catch (error) {
    await deleteMultipartUpload(deps, { contractFileId, s3UploadId, blockChainUploadId });
    throw error;
  }
}

export async function uploadPointCloudFile(
  deps: PointCloudUploadDeps,
  params: PointCloudUploadParams
): Promise<Record<string, unknown>> {
  const { contractId, name, buffer, pointCloudAttribute } = params;
  const { getApiPath, fetchImpl, getAuthHeaders } = deps;

  const startUrl = getApiPath("/contractFile/pointCloud");
  const uploadRequest = buildPointCloudUploadRequest({
    contractId,
    name,
    buffer,
    pointCloudAttribute,
  });
  const uploadRes = await fetchImpl(
    startUrl,
    buildStartApiFetchInit(uploadRequest, getAuthHeaders())
  );
  if (!uploadRes.ok) throw new Error(`HTTP ${uploadRes.status}`);
  const uploadData = (await uploadRes.json()) as { presignedURL: string; contractFileId: number };
  if (params.onContractFileCreated !== undefined) {
    params.onContractFileCreated(uploadData.contractFileId);
  }

  const presignedUpload = buildPresignedFileUpload(buffer);
  const uploadFileRes = await fetchImpl(uploadData.presignedURL, presignedUpload);
  if (!uploadFileRes.ok) throw new Error(`Upload failed: HTTP ${uploadFileRes.status}`);

  const completeUrl = getApiPath(`/contractFile/uploaded/${uploadData.contractFileId}`);
  const completeRes = await fetchImpl(
    completeUrl,
    buildCompleteApiFetchInit(contractId, getAuthHeaders())
  );
  if (!completeRes.ok) throw new Error(`Complete upload failed: HTTP ${completeRes.status}`);
  return (await completeRes.json()) as Record<string, unknown>;
}
