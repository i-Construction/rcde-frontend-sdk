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
