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
   *
   * R-CDEエラーコード | 内容
   * ---------|----------
   *  ERR0100001 | 認可情報取得エラー
   *  ERR0100002 | 認可エラー
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
   * 「２：作成済み」が返却される
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
     * @name PostExtV2AuthToken
     * @summary Create Token
     * @request POST:/ext/v2/auth/token
     */
    postExtV2AuthToken: (
      data: {
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
        path: `/ext/v2/auth/token`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description アクセストークン、リフレッシュトークンの再生成
     *
     * @name PostExtV2AuthenticatedRefresh
     * @summary Refresh Token
     * @request POST:/ext/v2/authenticated/refresh
     */
    postExtV2AuthenticatedRefresh: (
      data: {
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
        path: `/ext/v2/authenticated/refresh`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description pub用のトークンを作成
     *
     * @name PostExtV2AuthenticatedEquipmentToken
     * @summary Create Equipment Token
     * @request POST:/ext/v2/authenticated/equipmentToken
     */
    postExtV2AuthenticatedEquipmentToken: (
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
      this.request<
        {
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
        },
        Errors
      >({
        path: `/ext/v2/authenticated/equipmentToken`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場一覧取得
     *
     * @name GetExtV2AuthenticatedConstructionList
     * @summary Get Construction List
     * @request GET:/ext/v2/authenticated/construction
     */
    getExtV2AuthenticatedConstructionList: (params: RequestParams = {}) =>
      this.request<
        {
          /** 現場総数 */
          total?: number;
          /** 現場一覧 */
          constructions?: {
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
          }[];
        },
        Errors
      >({
        path: `/ext/v2/authenticated/construction`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 現場作成
     *
     * @name PostExtV2AuthenticatedConstruction
     * @summary Create Construction
     * @request POST:/ext/v2/authenticated/construction
     */
    postExtV2AuthenticatedConstruction: (
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
        path: `/ext/v2/authenticated/construction`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場詳細取得
     *
     * @name GetExtV2AuthenticatedConstruction
     * @summary Get Construction
     * @request GET:/ext/v2/authenticated/construction/{constructionId}
     */
    getExtV2AuthenticatedConstruction: (
      constructionId: number,
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
        path: `/ext/v2/authenticated/construction/${constructionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 現場編集
     *
     * @name PutExtV2AuthenticatedConstruction
     * @summary Update Construction
     * @request PUT:/ext/v2/authenticated/construction/{constructionId}
     */
    putExtV2AuthenticatedConstruction: (
      constructionId: number,
      data: {
        /** 工事名称 */
        name?: string;
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
        path: `/ext/v2/authenticated/construction/${constructionId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 現場削除
     *
     * @name DeleteExtV2AuthenticatedConstruction
     * @summary Delete Construction
     * @request DELETE:/ext/v2/authenticated/construction/{constructionId}
     */
    deleteExtV2AuthenticatedConstruction: (
      constructionId: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/authenticated/construction/${constructionId}`,
        method: "DELETE",
        body: data,
        ...params,
      }),

    /**
     * @description 契約項目一覧取得
     *
     * @name GetExtV2AuthenticatedContractList
     * @summary Get Contract List
     * @request GET:/ext/v2/authenticated/contract
     */
    getExtV2AuthenticatedContractList: (
      query?: {
        /** 現場ID */
        constructionId?: number;
        /** 「createdAt」は作成日、「accessedAt」はアクセス日時の降順。「name」は契約項目名の昇順 */
        sort?: string;
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
          /** 契約項目一覧 */
          contracts?: {
            /** 契約項目ID */
            id?: number;
            /** 契約項目名 */
            name?: string;
            /** 契約単価 */
            unitPrice?: number;
            /** 契約数量 */
            unitVolume?: number;
            /**
             * 契約日
             * @format date-time
             */
            contractedAt?: string;
            /**
             * 作成日
             * @format date-time
             */
            createdAt?: string;
            /**
             * 契約項目ステータス
             * 「２：作成済み」が返却される
             */
            status?: number;
          }[];
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contract`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目作成
     *
     * @name PostExtV2AuthenticatedContract
     * @summary Create Contract
     * @request POST:/ext/v2/authenticated/contract
     */
    postExtV2AuthenticatedContract: (
      data: {
        /** 契約項目名 */
        name: string;
        /**
         * 契約日
         * @format date-time
         */
        contractedAt: string;
        /** 契約単価 */
        unitPrice: number;
        /** 契約数量 */
        unitVolume: number;
        /** 現場ID */
        constructionId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目ID */
          id?: number;
          /** 契約項目名 */
          name?: string;
          /** 契約単価 */
          unitPrice?: number;
          /** 契約数量 */
          unitVolume?: number;
          /**
           * 契約日
           * @format date-time
           */
          contractedAt?: string;
          /**
           * 契約項目ステータス
           * 「２：作成済み」が返却される
           */
          status?: number;
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contract`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目詳細取得
     *
     * @name GetExtV2AuthenticatedContract
     * @summary Get Contract
     * @request GET:/ext/v2/authenticated/contract/{contractId}
     */
    getExtV2AuthenticatedContract: (
      contractId: number,
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目ID */
          id?: number;
          /** 契約項目名 */
          name?: string;
          /** 契約単価 */
          unitPrice?: number;
          /** 契約数量 */
          unitVolume?: number;
          /**
           * 契約日
           * @format date-time
           */
          contractedAt?: string;
          /**
           * 作成日
           * @format date-time
           */
          createdAt?: string;
          /**
           * 契約項目ステータス
           * 「２：作成済み」が返却される
           */
          status?: number;
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contract/${contractId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目編集
     *
     * @name PutExtV2AuthenticatedContract
     * @summary Update Contract
     * @request PUT:/ext/v2/authenticated/contract/{contractId}
     */
    putExtV2AuthenticatedContract: (
      contractId: number,
      data: {
        /** 契約項目名 */
        name?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目ID */
          id?: number;
          /** 契約項目名 */
          name?: string;
          /** 契約単価 */
          unitPrice?: number;
          /** 契約数量 */
          unitVolume?: number;
          /**
           * 契約日
           * @format date-time
           */
          contractedAt?: string;
          /**
           * 作成日
           * @format date-time
           */
          createdAt?: string;
          /**
           * 契約項目ステータス
           * 「２：作成済み」が返却される
           */
          status?: number;
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contract/${contractId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目削除
     *
     * @name DeleteExtV2AuthenticatedContract
     * @summary Delete Contract
     * @request DELETE:/ext/v2/authenticated/contract/{contractId}
     */
    deleteExtV2AuthenticatedContract: (
      contractId: number,
      data: any,
      params: RequestParams = {},
    ) =>
      this.request<void, Errors>({
        path: `/ext/v2/authenticated/contract/${contractId}`,
        method: "DELETE",
        body: data,
        ...params,
      }),

    /**
     * @description 契約項目ファイル一覧取得
     *
     * @name GetExtV2AuthenticatedContractFileList
     * @summary Get Contract File List
     * @request GET:/ext/v2/authenticated/contractFile
     */
    getExtV2AuthenticatedContractFileList: (
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
          contractFiles?: ContractFile[];
        },
        void
      >({
        path: `/ext/v2/authenticated/contractFile`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイル編集
     *
     * @name PutExtV2AuthenticatedContractFile
     * @summary Put Contract File
     * @request PUT:/ext/v2/authenticated/contractFile/{contractFileId}
     */
    putExtV2AuthenticatedContractFile: (
      contractFileId: string,
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
      this.request<ContractFile, any>({
        path: `/ext/v2/authenticated/contractFile/${contractFileId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 契約項目ファイル削除
     *
     * @name DeleteExtV2AuthenticatedContractFile
     * @summary Delete Contract File
     * @request DELETE:/ext/v2/authenticated/contractFile/{contractFileId}
     */
    deleteExtV2AuthenticatedContractFile: (
      contractFileId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/ext/v2/authenticated/contractFile/${contractFileId}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * @description 点群アップロード
     *
     * @name PostExtV2AuthenticatedContractFilePointCloud
     * @summary Upload Point Cloud
     * @request POST:/ext/v2/authenticated/contractFile/pointCloud
     */
    postExtV2AuthenticatedContractFilePointCloud: (
      data: {
        /** 契約項目ID */
        contractId: number;
        /** ファイル名 */
        name: string;
        /** ファイルサイズ */
        size: number;
        pointCloudAttribute?: PointCloudAttribute;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 署名付きURL */
          presignedURL?: string;
          /** 契約項目ファイルID */
          contractFileId?: number;
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contractFile/pointCloud`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description ファイルアップロード完了API
     *
     * @name PutExtV2AuthenticatedContractFileUploaded
     * @summary Complete Contract File Upload
     * @request PUT:/ext/v2/authenticated/contractFile/uploaded/{contractFileId}
     */
    putExtV2AuthenticatedContractFileUploaded: (
      contractFileId: number,
      data: {
        /** 契約項目ID */
        contractId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 契約項目ファイルID */
          id?: number;
          /** ファイル名 */
          name?: string;
          /**
           * 種別コード
           * - 設計情報: 1
           * -  施工管理（点群データ）: 2
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
           * - 技術検査済み: 3
           * - 給付検査済み: 4
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
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contractFile/uploaded/${contractFileId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
     *
     * @name PostExtV2AuthenticatedContractFilePointCloudMultipartUpload
     * @summary Multipart Upload Point Cloud
     * @request POST:/ext/v2/authenticated/contractFile/pointCloud/multipartUpload
     */
    postExtV2AuthenticatedContractFilePointCloudMultipartUpload: (
      data: {
        /** 契約項目ID */
        contractId: number;
        /** ファイル名 */
        name: string;
        /** ファイルサイズ */
        size: number;
        /** ファイルの分割数 */
        partTotal: number;
        pointCloudAttribute?: PointCloudAttribute;
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
        path: `/ext/v2/authenticated/contractFile/pointCloud/multipartUpload`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード完了
     *
     * @name PostExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
     * @summary Complete Multipart Upload Point Cloud
     * @request PUT:/ext/v2/authenticated/contractFile/pointCloud/completeMultipartUpload
     */
    postExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (
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
        path: `/ext/v2/authenticated/contractFile/pointCloud/completeMultipartUpload`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description 点群マルチパートアップロード削除
     *
     * @name PostExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload
     * @summary Delete Multipart Upload Point Cloud
     * @request DELETE:/ext/v2/authenticated/contractFile/pointCloud/deleteMultipartUpload
     */
    postExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload: (
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
        path: `/ext/v2/authenticated/contractFile/pointCloud/deleteMultipartUpload`,
        method: "DELETE",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description ファイルダウンロードURL取得
     *
     * @name GetExtV2AuthenticatedContractFileDownloadUrl
     * @summary Download Contract File
     * @request GET:/ext/v2/authenticated/contractFile/downloadURL/{contractFileId}
     */
    getExtV2AuthenticatedContractFileDownloadUrl: (
      contractFileId: number,
      query: {
        /** 契約項目ID */
        contractId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** 署名付きURL */
          presignedURL?: string;
        },
        Errors
      >({
        path: `/ext/v2/authenticated/contractFile/downloadURL/${contractFileId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description 処理ステータス取得
     *
     * @name GetExtV2AuthenticatedContractFileProcessingStatus
     * @summary Get Processing Status
     * @request GET:/ext/v2/authenticated/contractFile/processingStatus/{contractFileId}
     */
    getExtV2AuthenticatedContractFileProcessingStatus: (
      contractFileId: number,
      query: {
        /** 契約項目ID */
        contractId: number;
      },
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
        path: `/ext/v2/authenticated/contractFile/processingStatus/${contractFileId}`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description meta取得
     *
     * @name GetExtV2AuthenticatedPclodMeta
     * @summary Get Pclod Meta
     * @request GET:/ext/v2/authenticated/pclod/meta
     */
    getExtV2AuthenticatedPclodMeta: (
      query: {
        /** 契約項目ID */
        contractId: number;
        /** 契約項目ファイルID */
        contractFileId: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/authenticated/pclod/meta`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description imagePosition取得
     *
     * @name GetExtV2AuthenticatedPclodImagePosition
     * @summary Get Pclod Image Position
     * @request GET:/ext/v2/authenticated/pclod/imagePosition
     */
    getExtV2AuthenticatedPclodImagePosition: (
      query: {
        /** 契約項目ID */
        contractId: number;
        /** 契約項目ファイルID */
        contractFileId: number;
        /** the level of detail */
        level: number;
        /** the coordinate of the unit in whole LOD octree */
        addr: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/authenticated/pclod/imagePosition`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description imageColor取得
     *
     * @name GetExtV2AuthenticatedPclodImageColor
     * @summary Get Pclod Image Color
     * @request GET:/ext/v2/authenticated/pclod/imageColor
     */
    getExtV2AuthenticatedPclodImageColor: (
      query: {
        /** 契約項目ID */
        contractId: number;
        /** 契約項目ファイルID */
        contractFileId: number;
        /** the level of detail */
        level: number;
        /** the coordinate of the unit in whole LOD octree */
        addr: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, Errors>({
        path: `/ext/v2/authenticated/pclod/imageColor`,
        method: "GET",
        query: query,
        ...params,
      }),
  };
}
