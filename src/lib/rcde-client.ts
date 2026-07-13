import type { AuthType } from "../types/rcdeApiTypes";
import {
  uploadPointCloudFile,
  uploadPointCloudFileMultipart,
  type PointCloudMultipartUploadParams,
  type PointCloudUploadParams,
} from "./pointCloudUpload";

export type { AuthType };

export type RCDEClientOptions = {
  baseUrl?: string;
  accessToken?: string;
  authType?: AuthType;
  fetchImpl?: typeof fetch;
};

export type BatchProcessingResult = {
  id: number;
  status: 1 | 2 | 3;
};

export type ContractFile = {
  id: number;
  name: string;
  status?: string;
  uploadedAt?: string;
  batchProcessingResult?: BatchProcessingResult;
  /** batchProcessingResult.status が RCDE 既知値 (1|2|3) 以外のとき true */
  hasUnknownBatchStatus?: boolean;
};

type Json = Record<string, unknown>;

const AUTH_API_PREFIX: Record<AuthType, string> = {
  "2legged": "/ext/v2/authenticated",
  "3legged": "/ext/v2/userAuthenticated",
};

export class RCDEClient {
  private baseUrl: string;
  private token?: string;
  private authType: AuthType;
  private fetchImpl: typeof fetch;

  constructor(opts: RCDEClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? "";
    this.token = opts.accessToken;
    this.authType = opts.authType ?? "2legged";
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  private getApiPath(segment: string): string {
    return `${this.baseUrl}${AUTH_API_PREFIX[this.authType]}${segment}`;
  }

  // ---- 既存で使われている想定のAPI ----

  // Viewer などで使用
  async getContractFileList(params: {
    contractId: number;
  }): Promise<{ contractFiles: ContractFile[] }> {
    const { contractId } = params;
    const url = this.getApiPath("/contractFile");
    const queryParams = new URLSearchParams({ contractId: String(contractId) });
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { contractFiles: ContractFile[]; total?: number };
    const contractFiles = (data.contractFiles ?? []).map(parseContractFile);
    return { contractFiles };
  }

  async getContractFileMetadata(params: {
    contractId: number;
    contractFileId: number;
  }): Promise<Json> {
    const { contractId, contractFileId } = params;
    const url = this.getApiPath("/pclod/meta");
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
    });
    if (this.authType === "2legged") {
      queryParams.append("contractId", String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }

  // 画像（位置）バッファ
  async getContractFileImagePosition(params: {
    contractId: number;
    contractFileId: number;
    level?: number;
    addr?: string;
  }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = "0-0-0" } = params;
    const url = this.getApiPath("/pclod/imagePosition");
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
      level: String(level),
      addr,
    });
    if (this.authType === "2legged") {
      queryParams.append("contractId", String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // 画像（色）バッファ
  async getContractFileImageColor(params: {
    contractId: number;
    contractFileId: number;
    level?: number;
    addr?: string;
  }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = "0-0-0" } = params;
    const url = this.getApiPath("/pclod/imageColor");
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
      level: String(level),
      addr,
    });
    if (this.authType === "2legged") {
      queryParams.append("contractId", String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // ダウンロードURL
  async getContractFileDownloadUrl(
    contractId: number,
    fileId: number
  ): Promise<{ presignedURL: string; url: string }> {
    const url = this.getApiPath(`/contractFile/downloadURL/${fileId}`);
    let fullUrl = url;
    if (this.authType === "2legged") {
      const queryParams = new URLSearchParams({ contractId: String(contractId) });
      fullUrl = `${url}?${queryParams}`;
    }
    const res = await this.fetchImpl(fullUrl, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { presignedURL?: string; url?: string };
    const presignedURL = data.presignedURL ?? data.url ?? "";
    return { url: presignedURL, presignedURL };
  }

  // アップロード開始（点群アップロードAPIを使用）
  async uploadContractFile(params: PointCloudUploadParams): Promise<Json> {
    return uploadPointCloudFile(
      {
        getApiPath: (segment) => this.getApiPath(segment),
        fetchImpl: this.fetchImpl,
        getAuthHeaders: () => this.headers(),
      },
      params
    );
  }

  // チャンク分割アップロード（点群マルチパートアップロードAPIを使用）
  async uploadContractFileMultipart(
    params: PointCloudMultipartUploadParams
  ): Promise<{ contractFileId: number }> {
    return uploadPointCloudFileMultipart(
      {
        getApiPath: (segment) => this.getApiPath(segment),
        fetchImpl: this.fetchImpl,
        getAuthHeaders: () => this.headers(),
      },
      params
    );
  }

  // Construction関連のAPI
  async getConstructionList(): Promise<{ constructions: Construction[] }> {
    const url = this.getApiPath("/construction");
    const res = await this.fetchImpl(url, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { constructions: Construction[]; total?: number };
    return { constructions: data.constructions ?? [] };
  }

  async getConstruction(constructionId: number): Promise<Construction> {
    const url = this.getApiPath(`/construction/${constructionId}`);
    const res = await this.fetchImpl(url, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Construction;
  }

  async createConstruction(params: CreateConstructionParams): Promise<Json> {
    const url = this.getApiPath("/construction");
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }

  // Contract関連のAPI
  async getContractList(params: { constructionId: number }): Promise<{ contracts: Contract[] }> {
    const { constructionId } = params;
    const url = this.getApiPath("/contract");
    const queryParams = new URLSearchParams();
    if (this.authType === "2legged" || constructionId) {
      queryParams.append("constructionId", String(constructionId));
    }
    const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
    const res = await this.fetchImpl(fullUrl, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { contracts: Contract[]; total?: number };
    return { contracts: data.contracts ?? [] };
  }

  async createContract(params: {
    constructionId: number;
    name: string;
    contractedAt: string;
    status?: string;
  }): Promise<Json> {
    const { constructionId, name, contractedAt, status } = params;
    const url = this.getApiPath("/contract");
    const requestBody: Record<string, unknown> = {
      name,
      contractedAt,
      constructionId,
    };
    if (status !== undefined) {
      requestBody.status = status;
    }
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(requestBody),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }
}

export type Construction = {
  id: number;
  name: string;
  address?: string;
  contractedAt?: string;
  period?: string;
  contractAmount?: number;
  advancePaymentRate?: number;
};

export type Contract = {
  id: number;
  name: string;
  contractedAt?: string;
  status?: string;
};

function isKnownBatchStatus(status: number): status is BatchProcessingResult["status"] {
  const isStart = status === 1;
  const isInProgress = status === 2;
  const isFinish = status === 3;
  return isStart || isInProgress || isFinish;
}

function parseContractFile(raw: ContractFile): ContractFile {
  const batchProcessingResult = raw.batchProcessingResult;
  const hasBatchResult =
    batchProcessingResult !== undefined &&
    typeof batchProcessingResult.id === "number" &&
    typeof batchProcessingResult.status === "number";

  let normalizedBatchResult: BatchProcessingResult | undefined;
  let hasUnknownBatchStatus = false;

  if (hasBatchResult) {
    const status = batchProcessingResult.status;
    if (isKnownBatchStatus(status)) {
      normalizedBatchResult = {
        id: batchProcessingResult.id,
        status,
      };
    } else {
      hasUnknownBatchStatus = true;
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    status: raw.status,
    uploadedAt: raw.uploadedAt,
    batchProcessingResult: normalizedBatchResult,
    hasUnknownBatchStatus: hasUnknownBatchStatus ? true : undefined,
  };
}

export type CreateConstructionParams = {
  name: string;
  address?: string;
  contractedAt?: string;
  period?: string;
  contractAmount?: number;
  advancePaymentRate?: number;
};
