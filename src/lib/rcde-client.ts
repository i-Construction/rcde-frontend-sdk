export type AuthType = '2legged' | '3legged';

export type RCDEClientOptions = {
  baseUrl?: string;
  accessToken?: string;
  authType?: AuthType;
  fetchImpl?: typeof fetch;
};

export type ContractFile = {
  id: number;
  name: string;
  status?: string;
};

type Json = Record<string, unknown>;

export class RCDEClient {
  private baseUrl: string;
  private token?: string;
  private authType: AuthType;
  private fetchImpl: typeof fetch;

  constructor(opts: RCDEClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? '';
    this.token = opts.accessToken;
    this.authType = opts.authType ?? '2legged';
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  private getApiPath(segment: string): string {
    const prefix = this.authType === '3legged' ? '/ext/v2/userAuthenticated' : '/ext/v2/authenticated';
    return `${this.baseUrl}${prefix}${segment}`;
  }

  // ---- 既存で使われている想定のAPI ----

  // Viewer などで使用
  async getContractFileList(params: { contractId: number }): Promise<{ contractFiles: ContractFile[] }> {
    const { contractId } = params;
    const url = this.getApiPath('/contractFile');
    const queryParams = new URLSearchParams({ contractId: String(contractId) });
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { contractFiles: ContractFile[]; total?: number };
    return { contractFiles: data.contractFiles ?? [] };
  }

  async getContractFileMetadata(params: { contractId: number; contractFileId: number }): Promise<Json> {
    const { contractId, contractFileId } = params;
    const url = this.getApiPath('/pclod/meta');
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
    });
    if (this.authType === '2legged') {
      queryParams.append('contractId', String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }

  // 画像（位置）バッファ
  async getContractFileImagePosition(params: { contractId: number; contractFileId: number; level?: number; addr?: string }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = '0-0-0' } = params;
    const url = this.getApiPath('/pclod/imagePosition');
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
      level: String(level),
      addr,
    });
    if (this.authType === '2legged') {
      queryParams.append('contractId', String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // 画像（色）バッファ
  async getContractFileImageColor(params: { contractId: number; contractFileId: number; level?: number; addr?: string }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = '0-0-0' } = params;
    const url = this.getApiPath('/pclod/imageColor');
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
      level: String(level),
      addr,
    });
    if (this.authType === '2legged') {
      queryParams.append('contractId', String(contractId));
    }
    const res = await this.fetchImpl(`${url}?${queryParams}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // ダウンロードURL
  async getContractFileDownloadUrl(contractId: number, fileId: number): Promise<{ presignedURL: string; url: string }> {
    const url = this.getApiPath(`/contractFile/downloadURL/${fileId}`);
    let fullUrl = url;
    if (this.authType === '2legged') {
      const queryParams = new URLSearchParams({ contractId: String(contractId) });
      fullUrl = `${url}?${queryParams}`;
    }
    const res = await this.fetchImpl(fullUrl, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { presignedURL?: string; url?: string };
    const presignedURL = data.presignedURL ?? data.url ?? '';
    return { url: presignedURL, presignedURL };
  }

  // アップロード開始（点群アップロードAPIを使用）
  async uploadContractFile(params: { contractId: number; name: string; buffer: ArrayBuffer; pointCloudAttribute?: Record<string, unknown> }): Promise<Json> {
    const { contractId, name, buffer, pointCloudAttribute } = params;
    // まずアップロード開始APIを呼び出してpresignedURLを取得
    const uploadUrl = this.getApiPath('/contractFile/pointCloud');
    const uploadRequest = {
      contractId,
      name,
      size: buffer.byteLength,
      pointCloudAttribute: pointCloudAttribute ?? {},
    };
    const uploadRes = await this.fetchImpl(uploadUrl, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(uploadRequest),
    });
    if (!uploadRes.ok) throw new Error(`HTTP ${uploadRes.status}`);
    const uploadData = (await uploadRes.json()) as { presignedURL: string; contractFileId: number };

    // presignedURLにファイルをアップロード
    const uploadFileRes = await this.fetchImpl(uploadData.presignedURL, {
      method: 'PUT',
      body: buffer,
    });
    if (!uploadFileRes.ok) throw new Error(`Upload failed: HTTP ${uploadFileRes.status}`);

    // アップロード完了を通知
    const completeUrl = this.getApiPath(`/contractFile/uploaded/${uploadData.contractFileId}`);
    const completeRes = await this.fetchImpl(completeUrl, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ contractId }),
    });
    if (!completeRes.ok) throw new Error(`Complete upload failed: HTTP ${completeRes.status}`);
    return (await completeRes.json()) as Json;
  }

  // Construction関連のAPI
  async getConstructionList(): Promise<{ constructions: Construction[] }> {
    const url = this.getApiPath('/construction');
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
    const url = this.getApiPath('/construction');
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }

  // Contract関連のAPI
  async getContractList(params: { constructionId: number }): Promise<{ contracts: Contract[] }> {
    const { constructionId } = params;
    const url = this.getApiPath('/contract');
    const queryParams = new URLSearchParams();
    if (this.authType === '2legged' || constructionId) {
      queryParams.append('constructionId', String(constructionId));
    }
    const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
    const res = await this.fetchImpl(fullUrl, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { contracts: Contract[]; total?: number };
    return { contracts: data.contracts ?? [] };
  }

  async createContract(params: { constructionId: number; name: string; contractedAt: string; status?: string }): Promise<Json> {
    const { constructionId, name, contractedAt, status } = params;
    const url = this.getApiPath('/contract');
    const requestBody: Record<string, unknown> = {
      name,
      contractedAt,
      constructionId,
    };
    if (status !== undefined) {
      requestBody.status = status;
    }
    const res = await this.fetchImpl(url, {
      method: 'POST',
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

export type CreateConstructionParams = {
  name: string;
  address?: string;
  contractedAt?: string;
  period?: string;
  contractAmount?: number;
  advancePaymentRate?: number;
};
