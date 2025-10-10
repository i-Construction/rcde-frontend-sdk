export type RCDEClientOptions = {
  baseUrl?: string;
  accessToken?: string;
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
  private fetchImpl: typeof fetch;

  constructor(opts: RCDEClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? '';
    this.token = opts.accessToken;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  // ---- 既存で使われている想定のAPI ----

  async authenticate(): Promise<void> {
    // 必要ならセッション確認を実装。最小実装はresolveのみ
    return;
  }

  // Viewer などで使用
  async getContractFileList(params: { contractId: number }): Promise<{ contractFiles: ContractFile[] }> {
    const { contractId } = params;
    const res = await this.fetchImpl(`${this.baseUrl}/api/rcde/contracts/${contractId}/files`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { contractFiles: ContractFile[] };
  }

  async getContractFileMetadata(params: { contractId: number; contractFileId: number }): Promise<Json> {
    const { contractId, contractFileId } = params;
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/rcde/contract-files/${contractFileId}/metadata?contractId=${contractId}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }

  // 画像（位置）バッファ
  async getContractFileImagePosition(params: { contractId: number; contractFileId: number; level?: number; addr?: string }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = '0-0-0' } = params;
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/rcde/contract-files/${contractFileId}/imagePosition?contractId=${contractId}&level=${level}&addr=${addr}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // 画像（色）バッファ
  async getContractFileImageColor(params: { contractId: number; contractFileId: number; level?: number; addr?: string }): Promise<ArrayBuffer> {
    const { contractId, contractFileId, level = 0, addr = '0-0-0' } = params;
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/rcde/contract-files/${contractFileId}/imageColor?contractId=${contractId}&level=${level}&addr=${addr}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.arrayBuffer();
  }

  // ダウンロードURL（呼び出し側が presignedURL を前提にしているので両方返す）
  async getContractFileDownloadUrl(contractId: number, fileId: number): Promise<{ presignedURL: string; url: string }> {
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/rcde/contract-files/${fileId}/download-url?contractId=${contractId}`,
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { url: string; presignedURL?: string };
    return { url: data.url, presignedURL: data.presignedURL ?? data.url };
  }

  // アップロード開始（最小実装：内部APIの契約項目ファイルアップロードを叩く）
  async uploadContractFile(params: { contractId: number; file: File | Blob; filename: string }): Promise<Json> {
    const { contractId, file, filename } = params;
    const form = new FormData();
    form.append('file', file, filename);
    const res = await this.fetchImpl(
      `${this.baseUrl}/api/rcde/contracts/${contractId}/files/upload`,
      { method: 'POST', body: form /* headersはFormDataに任せる */ }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Json;
  }
}
