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
  /**
   * R-CDE 上の契約ファイル ID。R-CDE は常に数値を返すため、通常は必ず読める。
   *
   * 型が省略可能なのは、ここが res.json() 由来の未検証 JSON を受ける境界だからで、整数として
   * 読めない値が届いたときだけ undefined になる（parseEntityId）。利用側は ID を鍵にする処理
   * （表示状態の引き継ぎ、点群タイルの取得、ダウンロード URL の要求）の前に有無を確かめる。
   */
  id?: number;
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

/** API から届いたままの契約ファイル。検証前なので id と batchProcessingResult の中身は unknown 扱いにする */
type RawContractFile = {
  id?: unknown;
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

/** 問い合わせが空のときは ? を付けずパスだけを返す */
function buildUrlWithQuery(url: string, queryParams: URLSearchParams): string {
  const query = queryParams.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * 2legged のときだけ契約 ID を問い合わせの末尾に足す。
 *
 * 条件が違う 2 つ（getContractFileList は認証方式を見ず常に付ける、getContractList は現場 ID の
 * 真偽も見る）はここへ寄せない。揃えてよいかどうかは R-CDE 側の 3legged ハンドラが 2legged と
 * 同じ絞り込みをしているかで決まり、SDK 側だけでは判断できない。
 */
function appendContractIdFor2Legged(
  queryParams: URLSearchParams,
  authType: AuthType,
  contractId: number
): void {
  if (authType !== "2legged") return;
  queryParams.append("contractId", String(contractId));
}

/**
 * 点群タイル画像の問い合わせ URL を組み立てる。位置画像と色画像は取得先 URL だけが違い、
 * 問い合わせの並び（contractFileId → level → addr → contractId）も省略時の既定値も揃っている。
 *
 * imageEndpointUrl は問い合わせ文字列を付ける前のエンドポイント URL で、buildUrlWithQuery の
 * 第 1 引数と同じ役割。組み立て済みの画像 URL を渡す口ではない。
 */
function buildPclodImageUrl(
  imageEndpointUrl: string,
  authType: AuthType,
  params: { contractId: number; contractFileId: number; level?: number; addr?: string }
): string {
  const { contractId, contractFileId, level = 0, addr = "0-0-0" } = params;
  const queryParams = new URLSearchParams({
    contractFileId: String(contractFileId),
    level: String(level),
    addr,
  });
  appendContractIdFor2Legged(queryParams, authType, contractId);
  return buildUrlWithQuery(imageEndpointUrl, queryParams);
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

  /** R-CDE の応答を JSON として読む。失敗は sendRcdeRequest 側。T は検証せず信じた形。parse は呼び出し側 */
  private async requestJson<T>(url: string, init: Omit<RequestInit, "headers"> = {}): Promise<T> {
    const res = await sendRcdeRequest(this.fetchImpl, url, this.headers(), init);
    return (await res.json()) as T;
  }

  /** R-CDE の応答をバイナリのまま読む。点群タイル画像はここを通す（JSON へ寄せると読めなくなる） */
  private async requestArrayBuffer(url: string): Promise<ArrayBuffer> {
    const res = await sendRcdeRequest(this.fetchImpl, url, this.headers());
    return await res.arrayBuffer();
  }

  // ---- 既存で使われている想定のAPI ----

  // Viewer などで使用
  async getContractFileList(params: {
    contractId: number;
  }): Promise<{ contractFiles: ContractFile[] }> {
    const { contractId } = params;
    // 認証方式を見ず常に契約 ID を付ける形はここだけ（寄せない理由は appendContractIdFor2Legged の JSDoc）
    const queryParams = new URLSearchParams({ contractId: String(contractId) });
    const url = buildUrlWithQuery(this.getApiPath("/contractFile"), queryParams);
    const data = await this.requestJson<{ contractFiles: RawContractFile[]; total?: number }>(url);
    const contractFiles = (data.contractFiles ?? []).map(parseContractFile);
    return { contractFiles };
  }

  async getContractFileMetadata(params: {
    contractId: number;
    contractFileId: number;
  }): Promise<Json> {
    const { contractId, contractFileId } = params;
    const queryParams = new URLSearchParams({
      contractFileId: String(contractFileId),
    });
    appendContractIdFor2Legged(queryParams, this.authType, contractId);
    const url = buildUrlWithQuery(this.getApiPath("/pclod/meta"), queryParams);
    return this.requestJson<Json>(url);
  }

  // 画像（位置）バッファ
  async getContractFileImagePosition(params: {
    contractId: number;
    contractFileId: number;
    level?: number;
    addr?: string;
  }): Promise<ArrayBuffer> {
    const url = buildPclodImageUrl(this.getApiPath("/pclod/imagePosition"), this.authType, params);
    return this.requestArrayBuffer(url);
  }

  // 画像（色）バッファ
  async getContractFileImageColor(params: {
    contractId: number;
    contractFileId: number;
    level?: number;
    addr?: string;
  }): Promise<ArrayBuffer> {
    const url = buildPclodImageUrl(this.getApiPath("/pclod/imageColor"), this.authType, params);
    return this.requestArrayBuffer(url);
  }

  // ダウンロードURL
  async getContractFileDownloadUrl(
    contractId: number,
    fileId: number
  ): Promise<{ presignedURL: string; url: string }> {
    const queryParams = new URLSearchParams();
    appendContractIdFor2Legged(queryParams, this.authType, contractId);
    const url = buildUrlWithQuery(
      this.getApiPath(`/contractFile/downloadURL/${fileId}`),
      queryParams
    );
    const data = await this.requestJson<{ presignedURL?: string; url?: string }>(url);
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
    const data = await this.requestJson<{ constructions: RawConstruction[]; total?: number }>(url);
    return { constructions: (data.constructions ?? []).map(parseConstruction) };
  }

  async getConstruction(constructionId: number): Promise<Construction> {
    const url = this.getApiPath(`/construction/${constructionId}`);
    return parseConstruction(await this.requestJson<RawConstruction>(url));
  }

  async createConstruction(params: CreateConstructionParams): Promise<Json> {
    const url = this.getApiPath("/construction");
    return this.requestJson<Json>(url, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // Contract関連のAPI
  async getContractList(params: { constructionId: number }): Promise<{ contracts: Contract[] }> {
    const { constructionId } = params;
    const queryParams = new URLSearchParams();
    // 現場 ID の真偽も見る形はここだけ（2legged なら常に、3legged は現場 ID が truthy のときだけ）。
    // 揃えると 3legged で現場 ID 0 の絞り込みが消える（寄せない理由は appendContractIdFor2Legged の JSDoc）
    if (this.authType === "2legged" || constructionId) {
      queryParams.append("constructionId", String(constructionId));
    }
    const url = buildUrlWithQuery(this.getApiPath("/contract"), queryParams);
    const data = await this.requestJson<{ contracts: RawContract[]; total?: number }>(url);
    return { contracts: (data.contracts ?? []).map(parseContract) };
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
    return this.requestJson<Json>(url, {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
  }
}

export type Construction = {
  /**
   * R-CDE 上の現場 ID。省略可能な理由は `ContractFile.id` と同じで、ここが res.json() 由来の
   * 未検証 JSON を受ける境界だから。整数として読めない値が届いたときだけ undefined になる。
   */
  id?: number;
  name: string;
  address?: string;
  contractedAt?: string;
  period?: string;
  contractAmount?: number;
  advancePaymentRate?: number;
};

export type Contract = {
  /**
   * R-CDE 上の契約 ID。省略可能な理由は `ContractFile.id` と同じで、ここが res.json() 由来の
   * 未検証 JSON を受ける境界だから。整数として読めない値が届いたときだけ undefined になる。
   *
   * 3 つの ID の中でこれだけ影響範囲が広い。`appendContractIdFor2Legged` を通って 2-legged の
   * ほぼ全リクエストの問い合わせ文字列に載るため、読めない値を通すと失敗の出方が散らばる。
   */
  id?: number;
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

/**
 * R-CDE のエンティティ ID を数値として読める形に正規化する。読めない値は undefined にする。
 *
 * ID は R-CDE への問い合わせ文字列に載る（点群タイルの取得先、ダウンロード URL の要求、
 * 2-legged の契約 ID 付与）。未検証のまま通すと、文字列の "10" や NaN が String() を経て
 * URL に紛れ、R-CDE 側で別のエラーとして現れるため原因を追いにくい。
 *
 * typeof だけでは足りない。typeof NaN は "number" なので NaN が網をすり抜け、"NaN" という
 * 問い合わせになる。Number.isFinite でも足りない。String(1.5) は "1.5"、String(1e21) は
 * "1e+21" で、小数も指数表記もそのまま URL に載る。Number.isSafeInteger は NaN / Infinity /
 * 小数 / String() が指数表記になる大きさの数値を、1 つの述語でまとめて落とす。
 *
 * 値域（正の整数のみ）までは見ない。R-CDE の採番規則を SDK 側へ写すことになり、規則が変われば
 * SDK が正しい ID を捨てる。ここで守るのは「整数として URL に載せられること」だけにする。
 *
 * 読めない ID を持つ要素を一覧から取り除く形は採らない。名前や状態は読めるうえ、落とすと利用者が
 * アップロードしたはずのファイルを画面から探せなくなる。検証結果は ID の有無としてだけ表す。
 */
function parseEntityId(rawId: unknown): number | undefined {
  return typeof rawId === "number" && Number.isSafeInteger(rawId) ? rawId : undefined;
}

/** API から届いたままの現場。検証前なので id は unknown 扱いにする */
type RawConstruction = Omit<Construction, "id"> & { id?: unknown };

/** API から届いたままの契約。検証前なので id は unknown 扱いにする */
type RawContract = Omit<Contract, "id"> & { id?: unknown };

/**
 * 現場・契約は ID 以外のフィールドを SDK が解釈しない。ID だけ差し替えて残りはそのまま通す形にし、
 * R-CDE が返す未知のフィールドを取り落とさないようにする。
 *
 * 戻り値には id キーが必ず生える（読めなかったときは値が undefined）。読めたかどうかを
 * "id" in construction では判定できないので、利用側は c.id !== undefined で見る。
 */
function parseConstruction(rawConstruction: RawConstruction): Construction {
  return { ...rawConstruction, id: parseEntityId(rawConstruction.id) };
}

function parseContract(rawContract: RawContract): Contract {
  return { ...rawContract, id: parseEntityId(rawContract.id) };
}

function parseContractFile(rawContractFile: RawContractFile): ContractFile {
  const normalizedBatchResult = parseBatchProcessingResult(rawContractFile.batchProcessingResult);

  return {
    id: parseEntityId(rawContractFile.id),
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
