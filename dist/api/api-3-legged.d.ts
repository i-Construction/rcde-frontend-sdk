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
export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;
export interface ApiConfig<SecurityDataType = unknown> {
    baseUrl?: string;
    baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
    securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
    customFetch?: typeof fetch;
}
export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
    data: D;
    error: E;
}
type CancelToken = Symbol | string | number;
export declare enum ContentType {
    Json = "application/json",
    JsonApi = "application/vnd.api+json",
    FormData = "multipart/form-data",
    UrlEncoded = "application/x-www-form-urlencoded",
    Text = "text/plain"
}
export declare class HttpClient<SecurityDataType = unknown> {
    baseUrl: string;
    private securityData;
    private securityWorker?;
    private abortControllers;
    private customFetch;
    private baseApiParams;
    constructor(apiConfig?: ApiConfig<SecurityDataType>);
    setSecurityData: (data: SecurityDataType | null) => void;
    protected encodeQueryParam(key: string, value: any): string;
    protected addQueryParam(query: QueryParamsType, key: string): string;
    protected addArrayQueryParam(query: QueryParamsType, key: string): any;
    protected toQueryString(rawQuery?: QueryParamsType): string;
    protected addQueryParams(rawQuery?: QueryParamsType): string;
    private contentFormatters;
    protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams;
    protected createAbortSignal: (cancelToken: CancelToken) => AbortSignal | undefined;
    abortRequest: (cancelToken: CancelToken) => void;
    request: <T = any, E = any>({ body, secure, path, type, query, format, baseUrl, cancelToken, ...params }: FullRequestParams) => Promise<HttpResponse<T, E>>;
}
/**
 * @title rcde for external
 * @version 2.0.0
 * @baseUrl https://api.rcde.jp
 */
export declare class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    ext: {
        /**
         * @description アクセストークン、リフレッシュトークン生成
         *
         * @name PostExt3LeggedV2AuthToken
         * @summary Create Token
         * @request POST:/ext/v2/oauth/token
         */
        postExt3LeggedV2AuthToken: (data: {
            /** ログイン成功時のコールバックURLのクエリ文字列へ付与された値 */
            authCode: string;
            /** 企業管理画面にて払い出された値 */
            clientId: string;
            /** 企業管理画面にて払い出された値 */
            clientSecret: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
            accessToken?: string;
            refreshToken?: string;
            expiresAt?: number;
        }, Errors>>;
        /**
         * @description メンバー一覧取得
         *
         * @name GetExt3LeggedV2AuthenticatedUserList
         * @summary Get User List
         * @request GET:/ext/v2/userAuthenticated/user
         */
        getExt3LeggedV2AuthenticatedUserList: (query?: {
            /** 追加で取得するモデルの指定 */
            includes?: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** メンバー総数 */
            total?: number;
            /** メンバー一覧 */
            users?: User[];
        }, Errors>>;
        /**
         * @description 現場一覧取得
         *
         * @name GetExt3LeggedV2AuthenticatedConstructionList
         * @summary Get Construction List
         * @request GET:/ext/v2/userAuthenticated/construction
         */
        getExt3LeggedV2AuthenticatedConstructionList: (query?: {
            /** 追加で取得するモデルの指定 */
            includes?: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 現場総数 */
            total?: number;
            /** 現場一覧 */
            constructions?: Construction[];
        }, Errors>>;
        /**
         * @description 現場作成
         *
         * @name PostExt3LeggedV2AuthenticatedConstruction
         * @summary Create Construction
         * @request POST:/ext/v2/userAuthenticated/construction
         */
        postExt3LeggedV2AuthenticatedConstruction: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<Construction, Errors>>;
        /**
         * @description 現場詳細取得
         *
         * @name GetExt3LeggedV2AuthenticatedConstruction
         * @summary Get Construction
         * @request GET:/ext/v2/userAuthenticated/construction/{constructionId}
         */
        getExt3LeggedV2AuthenticatedConstruction: (constructionId: number, query?: {
            /** 追加で取得するモデルの指定 */
            includes?: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 現場編集
         *
         * @name PutExt3LeggedV2AuthenticatedConstruction
         * @summary Update Construction
         * @request PUT:/ext/v2/userAuthenticated/construction/{constructionId}
         */
        putExt3LeggedV2AuthenticatedConstruction: (constructionId: number, data: {
            /** 工事名称 */
            name?: string;
        }, params?: RequestParams) => Promise<HttpResponse<Construction, Errors>>;
        /**
         * @description 現場削除
         *
         * @name DeleteExt3LeggedV2AuthenticatedConstruction
         * @summary Delete Construction
         * @request DELETE:/ext/v2/userAuthenticated/construction/{constructionId}
         */
        deleteExt3LeggedV2AuthenticatedConstruction: (constructionId: number, data: any, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 現場へのメンバー招待
         *
         * @name PostExt3LeggedV2AuthenticatedConstructionUser
         * @summary Create Construction User
         * @request POST:/ext/v2/userAuthenticated/construction/{constructionId}/user
         */
        postExt3LeggedV2AuthenticatedConstructionUser: (constructionId: number, data: {
            /** 現場メンバー招待パラメータ一覧 */
            constructionUsersCreateParams?: {
                /** ユーザーID */
                userId?: number;
                /** 1: 現場管理者、2: 一般 */
                role?: number;
            }[];
        }, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 契約項目一覧取得
         *
         * @name GetExt3LeggedV2AuthenticatedContractList
         * @summary Get Contract List
         * @request GET:/ext/v2/userAuthenticated/contract
         */
        getExt3LeggedV2AuthenticatedContractList: (query?: {
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
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 契約項目総数 */
            total?: number;
            contracts?: Contract[];
        }, Errors>>;
        /**
         * @description 契約項目作成
         *
         * @name PostExt3LeggedV2AuthenticatedContract
         * @summary Create Contract
         * @request POST:/ext/v2/userAuthenticated/contract
         */
        postExt3LeggedV2AuthenticatedContract: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<Contract, Errors>>;
        /**
         * @description 契約項目承認
         *
         * @name PutExt3LeggedV2AuthenticatedContractApproved
         * @summary Update Contract Approval
         * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}/approved
         */
        putExt3LeggedV2AuthenticatedContractApproved: (contractId: number, params?: RequestParams) => Promise<HttpResponse<Contract, Errors>>;
        /**
         * @description 契約項目取り下げ(削除)
         *
         * @name DeleteExt3LeggedV2AuthenticatedContractDrop
         * @summary Delete Contract
         * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}/drop
         */
        deleteExt3LeggedV2AuthenticatedContractDrop: (contractId: number, params?: RequestParams) => Promise<HttpResponse<object, Errors>>;
        /**
         * @description 契約項目詳細取得
         *
         * @name GetExt3LeggedV2AuthenticatedContract
         * @summary Get Contract
         * @request GET:/ext/v2/userAuthenticated/contract/{contractId}
         */
        getExt3LeggedV2AuthenticatedContract: (contractId: number, params?: RequestParams) => Promise<HttpResponse<Contract, Errors>>;
        /**
         * @description 契約項目編集
         *
         * @name PutExt3LeggedV2AuthenticatedContract
         * @summary Update Contract
         * @request PUT:/ext/v2/userAuthenticated/contract/{contractId}
         */
        putExt3LeggedV2AuthenticatedContract: (contractId: number, data: {
            /** 契約項目名 */
            name?: string;
        }, params?: RequestParams) => Promise<HttpResponse<Contract, Errors>>;
        /**
         * @description 契約項目削除
         *
         * @name DeleteExt3LeggedV2AuthenticatedContract
         * @summary Delete Contract
         * @request DELETE:/ext/v2/userAuthenticated/contract/{contractId}
         */
        deleteExt3LeggedV2AuthenticatedContract: (contractId: number, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
         *
         * @name PostExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
         * @summary Multipart Upload Point Cloud
         * @request POST:/ext/v2/userAuthenticated/contractFile/pointCloud/multipartUpload
         */
        postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 点群マルチパートアップロード完了
         *
         * @name PutExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
         * @summary Complete Multipart Upload Point Cloud
         * @request PUT:/ext/v2/userAuthenticated/contractFile/pointCloud/completeMultipartUpload
         */
        putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 点群マルチパートアップロード削除
         *
         * @name DeleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload
         * @summary Delete Multipart Upload Point Cloud
         * @request DELETE:/ext/v2/userAuthenticated/contractFile/pointCloud/deleteMultipartUpload
         */
        deleteExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload: (data: {
            /** 契約項目ファイルID */
            contractFileId: number;
            /** S3アップロードID */
            s3UploadId: string;
            /** ブロックチェーンアップロードID */
            blockChainUploadId: string;
        }, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 契約項目ファイル一覧取得
         *
         * @name GetExt3LeggedV2AuthenticatedContractFileList
         * @summary Get Contract File List
         * @request GET:/ext/v2/userAuthenticated/contractFile
         */
        getExt3LeggedV2AuthenticatedContractFileList: (query: {
            /** 契約項目ID */
            contractId: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 契約項目ファイル総数 */
            total?: number;
            /** 契約項目ファイル一覧 */
            contractFiles?: ContractFile[];
        }, Errors>>;
        /**
         * @description 契約項目ファイルのダウンロードURL取得
         *
         * @name GetExt3LeggedV2AuthenticatedContractFileDownloadUrl
         * @summary Get Contract File Download URL
         * @request GET:/ext/v2/userAuthenticated/contractFile/downloadURL/{contractFileId}
         */
        getExt3LeggedV2AuthenticatedContractFileDownloadUrl: (contractFileId: number, params?: RequestParams) => Promise<HttpResponse<{
            /** 署名付きダウンロードURL(発行から30分間有効) */
            presignedURL?: string;
        }, Errors>>;
        /**
         * @description 契約項目ファイルの処理ステータス取得
         *
         * @name GetExt3LeggedV2AuthenticatedContractFileProcessingStatus
         * @summary Get Contract File Processing Status
         * @request GET:/ext/v2/userAuthenticated/contractFile/processingStatus/{contractFileId}
         */
        getExt3LeggedV2AuthenticatedContractFileProcessingStatus: (contractFileId: number, params?: RequestParams) => Promise<HttpResponse<{
            /**
             * 処理ステータス
             * - pending: 保留中
             * - completed: 完了
             */
            status?: string;
        }, Errors>>;
        /**
         * @description 契約項目ファイル更新
         *
         * @name PutExt3LeggedV2AuthenticatedContractFile
         * @summary Update Contract File
         * @request PUT:/ext/v2/userAuthenticated/contractFile/{contractFileId}
         */
        putExt3LeggedV2AuthenticatedContractFile: (contractFileId: number, data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<ContractFile, Errors>>;
        /**
         * @description 契約項目ファイル削除
         *
         * @name DeleteExt3LeggedV2AuthenticatedContractFile
         * @summary Delete Contract File
         * @request DELETE:/ext/v2/userAuthenticated/contractFile/{contractFileId}
         */
        deleteExt3LeggedV2AuthenticatedContractFile: (contractFileId: number, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description メタ情報取得
         *
         * @name GetExt3LeggedV2AuthenticatedPclodMeta
         * @summary Get Pclod Meta
         * @request GET:/ext/v2/userAuthenticated/pclod/meta
         */
        getExt3LeggedV2AuthenticatedPclodMeta: (query: {
            /** 契約項目ファイルID */
            contractFileId: number;
        }, params?: RequestParams) => Promise<HttpResponse<File, Errors>>;
        /**
         * @description Position画像取得
         *
         * @name GetExt3LeggedV2AuthenticatedPclodImagePosition
         * @summary Get Pclod Image Position
         * @request GET:/ext/v2/userAuthenticated/pclod/imagePosition
         */
        getExt3LeggedV2AuthenticatedPclodImagePosition: (query: {
            /** 契約項目ファイルID */
            contractFileId: number;
            level: number;
            addr: string;
        }, params?: RequestParams) => Promise<HttpResponse<File, Errors>>;
        /**
         * @description Color画像取得
         *
         * @name GetExt3LeggedV2AuthenticatedPclodImageColor
         * @summary Get PCLOD Image Color
         * @request GET:/ext/v2/userAuthenticated/pclod/imageColor
         */
        getExt3LeggedV2AuthenticatedPclodImageColor: (query: {
            /** 契約項目ファイルID */
            contractFileId: number;
            level: number;
            addr: string;
        }, params?: RequestParams) => Promise<HttpResponse<File, Errors>>;
        /**
         * @description pub APIトークン作成
         *
         * @name PostExt3LeggedV2AuthenticatedEquipmentToken
         * @summary Create Equipment Token
         * @request POST:/ext/v2/userAuthenticated/equipmentToken
         */
        postExt3LeggedV2AuthenticatedEquipmentToken: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<EquipmentToken, Errors>>;
    };
}
export {};
