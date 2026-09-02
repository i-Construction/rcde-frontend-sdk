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

/**
 * R-CDE へ 1 リクエスト送り、成功以外は HTTP ステータス付きで失敗させる。
 *
 * 認証ヘッダは呼び出し側が組み立てて渡す。ここで一律に載せる形にすると、点群本体の送信先である
 * オブジェクトストレージのプリサインド URL にも Authorization が付いてしまい、署名と食い違って
 * 弾かれる。宛先が R-CDE かどうかを判断できるのは呼び出し側だけなので、その判断をここへ持ち込まない。
 */
async function sendRcdeRequest(
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>,
  init: Omit<RequestInit, "headers"> = {}
): Promise<Response> {
  const res = await fetchImpl(url, { ...init, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/** R-CDE の応答を JSON として読む。成功以外は sendRcdeRequest が失敗させる */
async function requestRcdeJson<T>(
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>,
  init: Omit<RequestInit, "headers"> = {}
): Promise<T> {
  const res = await sendRcdeRequest(fetchImpl, url, headers, init);
  return (await res.json()) as T;
}

/** R-CDE の応答をバイナリのまま読む。点群タイル画像はここを通す（JSON へ寄せると読めなくなる） */
async function requestRcdeArrayBuffer(
  fetchImpl: typeof fetch,
  url: string,
  headers: Record<string, string>
): Promise<ArrayBuffer> {
  const res = await sendRcdeRequest(fetchImpl, url, headers);
  return await res.arrayBuffer();
}

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
    const data = await requestRcdeJson<{ contractFiles: RawContractFile[]; total?: number }>(
      this.fetchImpl,
      `${url}?${queryParams}`,
      this.headers()
    );
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
    return requestRcdeJson<Json>(this.fetchImpl, `${url}?${queryParams}`, this.headers());
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
    return requestRcdeArrayBuffer(this.fetchImpl, `${url}?${queryParams}`, this.headers());
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
    return requestRcdeArrayBuffer(this.fetchImpl, `${url}?${queryParams}`, this.headers());
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
    const data = await requestRcdeJson<{ presignedURL?: string; url?: string }>(
      this.fetchImpl,
      fullUrl,
      this.headers()
    );
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
    const data = await requestRcdeJson<{ constructions: Construction[]; total?: number }>(
      this.fetchImpl,
      url,
      this.headers()
    );
    return { constructions: data.constructions ?? [] };
  }

  async getConstruction(constructionId: number): Promise<Construction> {
    const url = this.getApiPath(`/construction/${constructionId}`);
    return requestRcdeJson<Construction>(this.fetchImpl, url, this.headers());
  }

  async createConstruction(params: CreateConstructionParams): Promise<Json> {
    const url = this.getApiPath("/construction");
    return requestRcdeJson<Json>(this.fetchImpl, url, this.headers(), {
      method: "POST",
      body: JSON.stringify(params),
    });
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
    const data = await requestRcdeJson<{ contracts: Contract[]; total?: number }>(
      this.fetchImpl,
      fullUrl,
      this.headers()
    );
    return { contracts: data.contracts ?? [] };
  }

  /**
   * 契約を作成する。
   *
   * status は受け取らない。R-CDE の契約作成 API（ContractCreateFor2LeggedParams /
   * ContractCreateFor3LeggedParams）に status フィールドが無く、送っても echo の Bind が捨てるため。
   * 作成直後の状態は R-CDE 側が決める（2-legged は受注者がダミーなので承認済みまで自動で進む）。
   *
   * TODO: R-CDE が必須にしている unitPrice / unitVolume をまだ送っていないため、
   * 現状このメソッドは 400 で失敗する。3-legged はさらに contracteeEmail / contractorEmail が要る。
   * 引数が増える破壊的変更になるので別 PR で対応する。
   */
  async createContract(params: {
    constructionId: number;
    name: string;
    contractedAt: string;
  }): Promise<Json> {
    const { constructionId, name, contractedAt } = params;
    const url = this.getApiPath("/contract");
    const requestBody: Record<string, unknown> = {
      name,
      contractedAt,
      constructionId,
    };
    return requestRcdeJson<Json>(this.fetchImpl, url, this.headers(), {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
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

export type CreateConstructionParams = {
  name: string;
  address?: string;
  contractedAt?: string;
  period?: string;
  contractAmount?: number;
  advancePaymentRate?: number;
};
