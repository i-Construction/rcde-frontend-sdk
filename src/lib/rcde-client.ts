import type { AuthType } from "../types/rcdeApiTypes";
import { isBatchProcessingStatus, type BatchProcessingStatus } from "./batchProcessingStatus";
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

/**
 * PCLOD バッチ処理の結果。`status` の値集合は R-CDE の BatchProcessingResultStatus と 1 対 1 で、
 * SDK が独自の値を混ぜることはない。R-CDE が SDK の知らない値を返したときだけ `status` が undefined になる。
 * `rawStatus` は R-CDE が返した数値そのもので、常に読める（`status` が undefined のときの調査に使う）。
 */
export type BatchProcessingResult = {
  id: number;
  status?: BatchProcessingStatus;
  rawStatus: number;
};

export type ContractFile = {
  id: number;
  name: string;
  /**
   * 契約ファイル自体のライフサイクル（R-CDE の CDEStatus）。1: WIP / 2: Shared /
   * 3: Published（技術検査済み） / 4: Archived（給付検査済み）。
   *
   * PCLOD の進捗とは別軸なので `batchProcessingResult.status` と混同しない。
   * 値 4 が「Archived」と「PCLOD 失敗」で偶然かぶる点に注意する。
   */
  status?: number;
  uploadedAt?: string;
  batchProcessingResult?: BatchProcessingResult;
};

/** API から届いたままの契約ファイル。検証前なので batchProcessingResult の中身は unknown 扱いにする */
type RawContractFile = {
  id: number;
  name: string;
  status?: number;
  uploadedAt?: string;
  batchProcessingResult?: { id?: unknown; status?: unknown } | null;
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
    const data = (await res.json()) as { contractFiles: RawContractFile[]; total?: number };
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

  /**
   * 点群ファイルを 1 リクエストでアップロードする。**2-legged 専用**。
   *
   * 経路の `POST /contractFile/pointCloud` と `PUT /contractFile/uploaded/:id` は R-CDE の
   * 2-legged 側にしか無く、3-legged では 404 になる。原因の分かるエラーで手前から止める。
   * 3-legged では `uploadContractFileMultipart` を使う。
   */
  async uploadContractFile(params: PointCloudUploadParams): Promise<Json> {
    if (this.authType === "3legged") {
      throw new Error(
        "uploadContractFile: 単発アップロードは 2legged 専用です。3legged では uploadContractFileMultipart を使ってください"
      );
    }
    return uploadPointCloudFile(
      {
        getApiPath: (segment) => this.getApiPath(segment),
        fetchImpl: this.fetchImpl,
        getAuthHeaders: () => this.headers(),
      },
      params
    );
  }

  /**
   * 点群ファイルをチャンク分割してアップロードする。2-legged / 3-legged の**どちらでも使える**。
   *
   * R-CDE は 3-legged 側にマルチパートの 3 ルートだけを用意しているため、3-legged の
   * アップロードはこちらが唯一の経路になる。
   */
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

  /**
   * 契約を作成する。
   *
   * status は受け取らない。R-CDE の契約作成 API（ContractCreateFor2LeggedParams /
   * ContractCreateFor3LeggedParams）に status フィールドが無く、送っても echo の Bind が捨てるため。
   * 作成直後の状態は R-CDE 側が決める（2-legged は受注者がダミーなので承認済みまで自動で進む）。
   *
   * unitPrice / unitVolume は R-CDE が `validate:"required"` にしている（uint64 なのでゼロ値は
   * required 不合格になる）ため必須で受け取る。1 以上を渡すこと。
   *
   * contracteeEmail / contractorEmail は 3-legged でどちらか必須（R-CDE の required_without）。
   * 2-legged では受注者がダミー企業として自動設定されるため不要で、渡しても R-CDE は読まない。
   * authType はクライアントのインスタンス側にあり引数の型では表現できないので、3-legged で
   * どちらも無いケースは送信前に弾く。
   */
  async createContract(params: {
    constructionId: number;
    name: string;
    contractedAt: string;
    unitPrice: number;
    unitVolume: number;
    contracteeEmail?: string;
    contractorEmail?: string;
  }): Promise<Json> {
    const { constructionId, name, contractedAt, unitPrice, unitVolume } = params;
    const { contracteeEmail, contractorEmail } = params;
    const hasCounterpartyEmail = contracteeEmail !== undefined || contractorEmail !== undefined;
    if (this.authType === "3legged" && !hasCounterpartyEmail) {
      throw new Error(
        "createContract: 3legged では contracteeEmail か contractorEmail のどちらかが必要です"
      );
    }
    const url = this.getApiPath("/contract");
    const requestBody: Record<string, unknown> = {
      name,
      contractedAt,
      constructionId,
      unitPrice,
      unitVolume,
    };
    if (contracteeEmail !== undefined) requestBody.contracteeEmail = contracteeEmail;
    if (contractorEmail !== undefined) requestBody.contractorEmail = contractorEmail;
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
  /**
   * 契約の承認ライフサイクル（R-CDE の ContactStatus）。1: 作成中（未承認） / 2: 作成済み（承認済み）。
   *
   * 契約ファイルの `ContractFile.status`（CDEStatus）とも PCLOD の
   * `batchProcessingResult.status`（BatchProcessingResultStatus）とも別軸なので混同しない。
   */
  status?: number;
};

function parseBatchProcessingResult(
  rawBatchResult: RawContractFile["batchProcessingResult"]
): BatchProcessingResult | undefined {
  // R-CDE は nil のとき batchProcessingResult のキーごと落とす（Go 側が omitempty 付きポインタ）ので
  // 実際に null は届かない。ただしここは res.json() 由来の未検証 JSON を受ける境界で、null を素通しすると
  // 分割代入が TypeError になり .map(parseContractFile) ごと reject して一覧が丸ごと落ちる
  if (rawBatchResult == null) return undefined;
  const { id, status } = rawBatchResult;
  if (typeof id !== "number") return undefined;
  if (typeof status !== "number") return undefined;
  // R-CDE と SDK のステータス値集合がずれたときは status を undefined にする。生値は rawStatus に残るので、
  // 利用側が処理中と誤認して待ち続けることも、原因を追えなくなることも起きない
  return isBatchProcessingStatus(status)
    ? { id, status, rawStatus: status }
    : { id, rawStatus: status };
}

function parseContractFile(rawContractFile: RawContractFile): ContractFile {
  const normalizedBatchResult = parseBatchProcessingResult(rawContractFile.batchProcessingResult);

  return {
    id: rawContractFile.id,
    name: rawContractFile.name,
    status: rawContractFile.status,
    uploadedAt: rawContractFile.uploadedAt,
    batchProcessingResult: normalizedBatchResult,
  };
}

/**
 * 現場の作成パラメータ。R-CDE の ConstructionCreateParams と 1 対 1 で、6 項目すべてが
 * `validate:"required"`（数値は uint / uint64 なのでゼロ値も不合格）。省略できる項目は無い。
 *
 * `name` は 1〜50 文字、`address` は 1〜100 文字。`contractedAt` / `period` は R-CDE 側が
 * time.Time で受けるので ISO 8601 の文字列を渡す。
 */
export type CreateConstructionParams = {
  name: string;
  address: string;
  contractedAt: string;
  period: string;
  contractAmount: number;
  advancePaymentRate: number;
};
