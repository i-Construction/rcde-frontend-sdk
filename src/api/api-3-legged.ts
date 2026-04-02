/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface PointCloudAttribute {
  id?: number;
  no?: string;
  time?: string;
  method?: string;
  equipment?: string;
  person?: string;
  crs?: string;
}

/**
 * error
 * 正常終了以外の返却値
 */
export interface Errors {
  /**
   * `code={HTTPステータスコード}, message={R-CDEエラーコード}: {エラー内容}`
   * R-CDEエラーコード | 内容
   * ---------|----------
   *  ERR0100001 | 認可情報取得エラー
   *  ERR0100002 | 認可エラー
   *  ERR0200001 | 企業管理者ではない場合の認可エラー
   *  ERR0201001 | 入力パラメータエラー
   *  ERR0201002 | 企業アプリケーション情報不正
   *  ERR0301001 | 企業アプリケーション情報取得エラー
   *  ERR0301002 | トークン作成者不正
   *  ERR0301003 | アクセストークン生成エラー
   *  ERR0301004 | リフレッシュトークン生成エラー
   *  ERR0202001 | 入力パラメータエラー
   *  ERR0202002 | 企業アプリケーション情報不正
   *  ERR0302001 | 無効なServiceHUBトークンエラー
   *  ERR0103001 | 企業アプリケーション情報不正
   *  ERR0103002 | オリジン不正
   *  ERR0103003 | tokenの種類不正
   *  ERR0103004 | 発行者不正
   *  ERR0103005 | 企業アプリケーションID不正
   *  ERR0103006 | 企業アプリケーション情報取得エラー
   *  ERR0103007 | トークン作成者不正
   *  ERR0103008 | CORSポリシー適用エラー
   *  ERR0103009 | token有効期限切れ
   *  ERR0103010 | token検証エラー（有効期限切れ以外）
   *  ERR0203001 | 入力パラメータエラー
   *  ERR0203002 | 企業アプリケーション情報不正
   *  ERR0303001 | 無効なServiceHUBトークンエラー
   *  ERR0303002 | 無効なSkydioトークンエラー
   *  ERR0303003 | 該当するフライトデータが無い
   *  ERR0303004 | 該当する画像データが無い
   *  ERR0204001 | 入力パラメータエラー
   *  ERR0204002 | 企業アプリケーション情報不正
   *  ERR0304001 | 無効なServiceHUBトークンエラー
   *  ERR0205001 | 入力パラメータエラー
   *  ERR0205002 | 企業アプリケーション情報不正
   *  ERR0206001 | 入力パラメータエラー
   *  ERR0206002 | 企業アプリケーション情報不正
   *  ERR0305001 | 発注者と受注者が同一エラー
   *  ERR0305002 | 現場の発注者が契約項目の受注者として指定された時のエラー
   *  ERR0103011 | 入力パラメータ不正
   *  ERR0207001 | 入力パラメータエラー
   *  ERR0207002 | 企業アプリケーション情報不正
   *  ERR0207003 | カテゴリー不正
   *  ERR0207004 | S3操作不正
   *  ERR0208001 | 入力パラメータエラー
   *  ERR0209001 | 入力パラメータエラー
   *  ERR0210001 | 入力パラメータエラー
   *  ERR0211001 | 入力パラメータエラー
   *  ERR0212001 | 入力パラメータエラー
   *  ERR0212002 | カテゴリー不正
   *  ERR0212003 | S3操作不正
   *  ERR0213001 | 入力パラメータエラー
   */
  errors?: string[];
}

/**
 * contractFile
 * 契約項目ファイル
 */
export interface ContractFile {
  /** 契約項目ファイルID */
  id?: number;
  /** ファイル名 */
  name?: string;
  /**
   * 種別コード
   * - 設計情報: 1
   * - 施工管理（点群データ）: 2
   * - ヒートマップ: 3
   * - IFC: 4
   * - Slope: 5
   * - Trimmed Point Cloud: 6
   * - Generated Heat Map: 7
   * - Generated Slope Angle: 8
   * - Liner Information: 9
   * - 吹付: 10
   * - 覆工: 11
   * - 評価: 12
   * - DXF: 13
   * - OBJ: 14
   * - STL: 15
   * - RVT: 16
   */
  category?: number;
  /**
   * ステータス
   * - WIP: 1
   * - Shared: 2
   * - Published（技術検査済み）: 3
   * - Archived（給付検査済み）: 4
   */
  status?: number;
  /**
   * ファイルの整合姓
   * - 未チェック: 1
   * - 正: 2
   * - 否: 3
   */
  fileCheckStatus?: number;
  /** 作成日 */
  createdAt?: string;
  /** 更新日 */
  updatedAt?: string;
  /** アップロード日 */
  uploadedAt?: string;
  /** ファイル */
  file?: File;
  /** 契約項目 */
  contract?: Contract;
  /** バッチ処理結果 */
  batchProcessingResult?: BatchProcessingResult;
  pointCloudAttribute?: PointCloudAttribute;
}

/**
 * file
 * ファイル
 */
export interface File {
  /** ファイルID */
  id?: number;
  /** ファイルサイズ */
  size?: number;
  /** ファイル名 */
  name?: string;
}

/**
 * company
 * 企業情報
 */
export interface Company {
  /** 企業ID */
  id?: number;
  /** 企業名 */
  name?: string;
}

/**
 * construction
 * 現場情報
 */
export interface Construction {
  /** 現場ID */
  id?: number;
  /** 工事名称 */
  name?: string;
  /** 住所 */
  address?: string;
  /** 契約日 */
  contractedAt?: string;
  /** 完成期日 */
  period?: string;
  /** 前払い金額率 */
  advancePaymentRate?: number;
  /** 請負金額 */
  contractAmount?: number;
  /** 企業情報 */
  contractee?: Company;
}

/**
 * contract
 * 契約項目
 */
export interface Contract {
  /** 契約項目ID */
  id?: number;
  /** 契約項目名 */
  name?: string;
  /** 契約単価 */
  unitPrice?: number;
  /** 契約数量 */
  unitVolume?: number;
  /** 契約日 */
  contractedAt?: string;
  /** 作成日 */
  createdAt?: string;
  /**
   * 契約項目ステータス
   * - 承認依頼中: 1
   * - 承認済み: 2
   */
  status?: number;
}

/**
 * batchProcessingResult
 * バッチ処理結果
 */
export interface BatchProcessingResult {
  /** バッチ処理結果ID */
  id?: number;
  /**
   * ステータス
   * - 開始: 1
   * - 進行中: 2
   * - 完了: 3
   */
  status?: number;
}

/**
 * user
 * メンバー
 */
export interface User {
  /** メンバーID */
  id?: number;
  /** 名前 */
  name?: string;
  /** メールアドレス */
  email?: string;
  /**
   * 権限
   * - システム管理者: 1
   * - 一般: 2
   */
  role?: number;
  /** ベータ版機能アクセス権限 */
  canBetaAccess?: boolean;
  /** 企業メンバー */
  companyUser?: {
    /** 企業メンバーID */
    id?: number;
    /**
     * 権限
     * - 企業管理者: 1
     * - 一般: 2
     */
    role?: number;
    /** 企業情報 */
    company?: Company;
  };
  /** 現場メンバー */
  constructionUsers?: {
    /** 現場メンバーID */
    id?: number;
    /**
     * 権限
     * - 現場管理者: 1
     * - 一般: 2
     */
    role?: number;
    /** 作成日 */
    createdAt?: string;
    /** 更新日 */
    updatedAt?: string;
    /** 現場情報 */
    construction?: Construction;
  }[];
}

/**
 * equipmentToken
 * pub APIトークン
 */
export interface EquipmentToken {
  /** トークンID */
  id?: number;
  /** トークン */
  token?: string;
  /**
   * 有効期限
   * @format date-time
   */
  expiredAt?: string;
  /** 有効期限切れの場合true */
  isExpired?: boolean;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "https://api.rcde.jp";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => "undefined" !== typeof query[key],
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key),
      )
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.JsonApi]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string")
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== "string"
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: any) => {
      if (input instanceof FormData) {
        return input;
      }

      return Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
              ? JSON.stringify(property)
              : `${property}`,
        );
        return formData;
      }, new FormData());
    },
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams,
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken,
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { "Content-Type": type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === "undefined" || body === null
            ? null
            : payloadFormatter(body),
      },
    ).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const responseToParse = responseFormat ? response.clone() : response;
      const data = !responseFormat
        ? r
        : await responseToParse[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title rcde for external
 * @version 2.0.0
 * @baseUrl https://api.rcde.jp
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  ext = {
    /**
     * @description アクセストークン、リフレッシュトークン生成
     *
     * @name PostExt3LeggedV2AuthToken
     * @summary Create Token
     * @request POST:/ext/v2/oauth/token
     */
    postExt3LeggedV2AuthToken: (
      data: {
        /** ログイン成功時のコールバックURLのクエリ文字列へ付与された値 */
        authCode: string;
        /** 企業管理画面にて払い出された値 */
        clientId: string;
        /** 企業管理画面にて払い出された値 */
        clientSecret: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          accessToken?: string;
          refreshToken?: string;
          expiresAt?: number;
        },
        Errors
      >({
        path: `/ext/v2/oauth/token`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description メンバー一覧取得
     *
     * @name GetExt3LeggedV2AuthenticatedUserList
     * @summary Get User List
     * @request GET:/ext/v2/userAuthenticated/user
     */
    getExt3LeggedV2AuthenticatedUserList: (
      query?: {
        /** 追加で取得するモデルの指定 */
        includes?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** メンバー総数 */
          total?: number;
          /** メンバー一覧 */
          users?: User[];
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/user`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場一覧取得
     *
     * @name GetExt3LeggedV2AuthenticatedConstructionList
     * @summary Get Construction List
     * @request GET:/ext/v2/userAuthenticated/construction
     */
    getExt3LeggedV2AuthenticatedConstructionList: (
      query?: {
        /** 追加で取得するモデルの指定 */
        includes?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 現場総数 */
          total?: number;
          /** 現場一覧 */
          constructions?: Construction[];
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/construction`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場作成
     *
     * @name PostExt3LeggedV2AuthenticatedConstruction
     * @summary Create Construction
     * @request POST:/ext/v2/userAuthenticated/construction
     */
    postExt3LeggedV2AuthenticatedConstruction: (
      data: {
        /** 工事名称 */
        name: string;
        /** 住所 */
        address: string;
        /**
         * 契約日
         * @format date-time
         */
        contractedAt: string;
        /**
         * 完成期日
         * @format date-time
         */
        period: string;
        /** 前払い金額率 */
        advancePaymentRate: number;
        /** 請負金額 */
        contractAmount: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<Construction, Errors>({
        path: `/ext/v2/userAuthenticated/construction`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場詳細取得
     *
     * @name GetExt3LeggedV2AuthenticatedConstruction
     * @summary Get Construction
     * @request GET:/ext/v2/userAuthenticated/construction/{constructionId}
     */
    getExt3LeggedV2AuthenticatedConstruction: (
      constructionId: number,
      query?: {
        /** 追加で取得するモデルの指定 */
        includes?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 現場ID */
          id?: number;
          /** 工事名称 */
          name?: string;
          /** 住所 */
          address?: string;
          /**
           * 契約日
           * @format date-time
           */
          contractedAt?: string;
          /**
           * 完成期日
           * @format date-time
           */
          period?: string;
          /** 前払い金額率 */
          advancePaymentRate?: number;
          /** 請負金額 */
          contractAmount?: number;
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/construction/${constructionId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場編集
     *
     * @name PutExt3LeggedV2AuthenticatedConstruction
     * @summary Update Construction
     * @request PUT:/ext/v2/userAuthenticated/construction/{constructionId}
     */
    putExt3LeggedV2AuthenticatedConstruction: (
      constructionId: number,
      data: {
        /** 工事名称 */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Construction, Errors>({
        path: `/ext/v2/userAuthenticated/construction/${constructionId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場削除
     *
     * @name DeleteExt3LeggedV2AuthenticatedConstruction
     * @summary Delete Construction
     * @request DELETE:/ext/v2/userAuthenticated/construction/{constructionId}
     */
    deleteExt3LeggedV2AuthenticatedConstruction: (
      constructionId: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/construction/${constructionId}`,
        method: "DELETE",
        body: data,
        ...params,
      }),

    /**
     * @description 現場へのメンバー招待
     *
     * @name PostExt3LeggedV2AuthenticatedConstructionUser
     * @summary Create Construction User
     * @request POST:/ext/v2/userAuthenticated/construction/{constructionId}/user
     */
    postExt3LeggedV2AuthenticatedConstructionUser: (
      constructionId: number,
      data: {
        /** 現場メンバー招待パラメータ一覧 */
        constructionUsersCreateParams?: {
          /** ユーザーID */
          userId?: number;
          /** 1: 現場管理者、2: 一般 */
          role?: number;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/construction/${constructionId}/user`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 契約項目一覧取得
     *
     * @name GetExt3LeggedV2AuthenticatedContractList
     * @summary Get Contract List
     * @request GET:/ext/v2/userAuthenticated/contract
     */
    getExt3LeggedV2AuthenticatedContractList: (
      query?: {
        /** 現場ID */
        constructionId?: number;
        /**
         * - createdAt: 作成日の降順
         * - accessedAt: アクセス日時の降順
         * - name: 契約項目名の昇順
         */
        sort?: "createdAt" | "accessedAt" | "name";
        /**
         * - contractor: 受注した契約項目
         * - contractee: 発注した契約項目
         * - unapproved: 未承認の契約項目
         * - creator: 依頼中の契約項目
         */
        searchType?: "contractor" | "contractee" | "unapproved" | "creator";
        /** 現在のページ番号。perPageも設定すること */
        currentPage?: number;
        /** 1ページの表示数。currentPareも設定すること */
        perPage?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目総数 */
          total?: number;
          contracts?: Contract[];
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/contract`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目作成
     *
     * @name PostExt3LeggedV2AuthenticatedContract
     * @summary Create Contract
     * @request POST:/ext/v2/userAuthenticated/contract
     */
    postExt3LeggedV2AuthenticatedContract: (
      data: {
        /** 現場ID */
        constructionId: number;
        /** 契約項目名 */
        name: string;
        /** 契約単価 */
        unitPrice: number;
        /** 契約数量 */
        unitVolume: number;
        /**
         * 契約日
         * @format date-time
         */
        contractedAt: string;
        /** 受注者として作成する場合の発注者企業のメールアドレス(contracteeEmailまたはcontractorEmailどちらか一方を指定) */
        contracteeEmail?: string;
        /** 発注者として作成する場合の受注者企業のメールアドレス(contracteeEmailまたはcontractorEmailどちらか一方を指定) */
        contractorEmail?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Contract, Errors>({
        path: `/ext/v2/userAuthenticated/contract`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目承認
     *
     * @name PutExt3LeggedV2AuthenticatedContractApproved
     * @summary Update Contract Approval
     * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}/approved
     */
    putExt3LeggedV2AuthenticatedContractApproved: (
      contractId: number,
      params: RequestParams = {},
    ) =>
      this.request<Contract, Errors>({
        path: `/ext/v2/userAuthenticated/contract/${contractId}/approved`,
        method: "PUT",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目取り下げ(削除)
     *
     * @name DeleteExt3LeggedV2AuthenticatedContractDrop
     * @summary Delete Contract
     * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}/drop
     */
    deleteExt3LeggedV2AuthenticatedContractDrop: (
      contractId: number,
      params: RequestParams = {},
    ) =>
      this.request<object, Errors>({
        path: `/ext/v2/userAuthenticated/contract/${contractId}/drop`,
        method: "DELETE",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目詳細取得
     *
     * @name GetExt3LeggedV2AuthenticatedContract
     * @summary Get Contract
     * @request GET:/ext/v2/userAuthenticated/contract/{contractId}
     */
    getExt3LeggedV2AuthenticatedContract: (
      contractId: number,
      params: RequestParams = {},
    ) =>
      this.request<Contract, Errors>({
        path: `/ext/v2/userAuthenticated/contract/${contractId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目編集
     *
     * @name PutExt3LeggedV2AuthenticatedContract
     * @summary Update Contract
     * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}
     */
    putExt3LeggedV2AuthenticatedContract: (
      contractId: number,
      data: {
        /** 契約項目名 */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<Contract, Errors>({
        path: `/ext/v2/userAuthenticated/contract/${contractId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目削除
     *
     * @name DeleteExt3LeggedV2AuthenticatedContract
     * @summary Delete Contract
     * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}
     */
    deleteExt3LeggedV2AuthenticatedContract: (
      contractId: number,
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/contract/${contractId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
     *
     * @name PostExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
     * @summary Multipart Upload Point Cloud
     * @request POST:/ext/v2/userAuthenticated/contractFile/pointCloud/multipartUpload
     */
    postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (
      data: {
        /** 契約項目ID */
        contractId: number;
        /** ファイル名 */
        name: string;
        /** ファイルサイズ */
        size: number;
        /** ファイルの分割数 */
        partTotal: number;
        pointCloudAttribute?: {
          no?: string;
          time?: string;
          method?: string;
          equipment?: string;
          person?: string;
          crs?: string;
        };
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** S3アップロードID */
          s3UploadId?: string;
          presignedUploadParts?: {
            /** パート番号 */
            partNumber?: number;
            /** 署名付きURL(S3の署名付きURLによるアップロード方法) */
            presignedURL?: string;
          }[];
          /** ブロックチェーンアップロードID */
          blockChainUploadId?: string;
          /** ブロックチェーンアップロードURL一覧(PUTメソッドかつmultipart/form-dataでアップロードする) */
          blockChainUploadURLs?: string[];
          /** 契約項目ファイルID */
          contractFileId?: number;
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/contractFile/pointCloud/multipartUpload`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード完了
     *
     * @name PutExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
     * @summary Complete Multipart Upload Point Cloud
     * @request PUT:/ext/v2/userAuthenticated/contractFile/pointCloud/completeMultipartUpload
     */
    putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (
      data: {
        /** 契約項目ファイルID */
        contractFileId: number;
        /** S3アップロードID */
        s3UploadId: string;
        s3Parts: {
          /** パート番号 */
          partNumber?: number;
          /** presignedURLによるファイルアップロードのレスポンスヘッダーから得られるETag */
          etag?: string;
        }[];
        /** ブロックチェーンアップロードID */
        blockChainUploadId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/contractFile/pointCloud/completeMultipartUpload`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード削除
     *
     * @name DeleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
     * @summary Delete Multipart Upload Point Cloud
     * @request DELETE:/ext/v2/userAuthenticated/contractFile/pointCloud/deleteMultipartUpload
     */
    deleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (
      data: {
        /** 契約項目ファイルID */
        contractFileId: number;
        /** S3アップロードID */
        s3UploadId: string;
        /** ブロックチェーンアップロードID */
        blockChainUploadId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/contractFile/pointCloud/deleteMultipartUpload`,
        method: "DELETE",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 契約項目ファイル一覧取得
     *
     * @name GetExt3LeggedV2AuthenticatedContractFileList
     * @summary Get Contract File List
     * @request GET:/ext/v2/userAuthenticated/contractFile
     */
    getExt3LeggedV2AuthenticatedContractFileList: (
      query: {
        /** 契約項目ID */
        contractId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目ファイル総数 */
          total?: number;
          /** 契約項目ファイル一覧 */
          contractFiles?: ContractFile[];
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/contractFile`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイルのダウンロードURL取得
     *
     * @name GetExt3LeggedV2AuthenticatedContractFileDownloadUrl
     * @summary Get Contract File Download URL
     * @request GET:/ext/v2/userAuthenticated/contractFile/downloadURL/{contractFileId}
     */
    getExt3LeggedV2AuthenticatedContractFileDownloadUrl: (
      contractFileId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 署名付きダウンロードURL(発行から30分間有効) */
          presignedURL?: string;
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/contractFile/downloadURL/${contractFileId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイルの処理ステータス取得
     *
     * @name GetExt3LeggedV2AuthenticatedContractFileProcessingStatus
     * @summary Get Contract File Processing Status
     * @request GET:/ext/v2/userAuthenticated/contractFile/processingStatus/{contractFileId}
     */
    getExt3LeggedV2AuthenticatedContractFileProcessingStatus: (
      contractFileId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /**
           * 処理ステータス
           * - pending: 保留中
           * - completed: 完了
           */
          status?: string;
        },
        Errors
      >({
        path: `/ext/v2/userAuthenticated/contractFile/processingStatus/${contractFileId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイル更新
     *
     * @name PutExt3LeggedV2AuthenticatedContractFile
     * @summary Update Contract File
     * @request PUT:/ext/v2/userAuthenticated/contractFile/{contractFileId}
     */
    putExt3LeggedV2AuthenticatedContractFile: (
      contractFileId: number,
      data: {
        /** ファイル名 */
        name?: string;
        /**
         * ステータス
         * - WIP: 1
         * - Shared: 2
         * - Published（技術検査済み）: 3
         * - Archived（給付検査済み）: 4
         */
        status?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ContractFile, Errors>({
        path: `/ext/v2/userAuthenticated/contractFile/${contractFileId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイル削除
     *
     * @name DeleteExt3LeggedV2AuthenticatedContractFile
     * @summary Delete Contract File
     * @request DELETE:/ext/v2/userAuthenticated/contractFile/{contractFileId}
     */
    deleteExt3LeggedV2AuthenticatedContractFile: (
      contractFileId: number,
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/userAuthenticated/contractFile/${contractFileId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description メタ情報取得
     *
     * @name GetExt3LeggedV2AuthenticatedPclodMeta
     * @summary Get Pclod Meta
     * @request GET:/ext/v2/userAuthenticated/pclod/meta
     */
    getExt3LeggedV2AuthenticatedPclodMeta: (
      query: {
        /** 契約項目ファイルID */
        contractFileId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/userAuthenticated/pclod/meta`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Position画像取得
     *
     * @name GetExt3LeggedV2AuthenticatedPclodImagePosition
     * @summary Get Pclod Image Position
     * @request GET:/ext/v2/userAuthenticated/pclod/imagePosition
     */
    getExt3LeggedV2AuthenticatedPclodImagePosition: (
      query: {
        /** 契約項目ファイルID */
        contractFileId: number;
        level: number;
        addr: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/userAuthenticated/pclod/imagePosition`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Color画像取得
     *
     * @name GetExt3LeggedV2AuthenticatedPclodImageColor
     * @summary Get PCLOD Image Color
     * @request GET:/ext/v2/userAuthenticated/pclod/imageColor
     */
    getExt3LeggedV2AuthenticatedPclodImageColor: (
      query: {
        /** 契約項目ファイルID */
        contractFileId: number;
        level: number;
        addr: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/userAuthenticated/pclod/imageColor`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description pub APIトークン作成
     *
     * @name PostExt3LeggedV2AuthenticatedEquipmentToken
     * @summary Create Equipment Token
     * @request POST:/ext/v2/userAuthenticated/equipmentToken
     */
    postExt3LeggedV2AuthenticatedEquipmentToken: (
      data: {
        /** 契約項目ID */
        contractId: number;
        /**
         * 有効期限種別
         *
         * 有効期限 | 設定値
         * ---------|----------
         *  1時間 | 1
         *  12時間 | 2
         *  1日 | 3
         *  3日 | 4
         *  1週間 | 5
         *  1ヶ月 | 6
         *  3ヶ月 | 7
         *  半年 | 8
         *  1年 | 9
         *  永久 | 99
         */
        expirationType: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<EquipmentToken, Errors>({
        path: `/ext/v2/userAuthenticated/equipmentToken`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
