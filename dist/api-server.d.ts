import { ContractFile as ContractFile_2 } from './api-2-legged';
import { File as File_3 } from './api-2-legged';

/**
 * @title rcde for external
 * @version 2.0.0
 * @baseUrl https://api.rcde.jp
 */
declare class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
    ext: {
        /**
         * @description アクセストークン、リフレッシュトークン生成
         *
         * @name PostExtV2AuthToken
         * @summary Create Token
         * @request POST:/ext/v2/auth/token
         */
        postExtV2AuthToken: (data: {
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
         * @description アクセストークン、リフレッシュトークンの再生成
         *
         * @name PostExtV2AuthenticatedRefresh
         * @summary Refresh Token
         * @request POST:/ext/v2/authenticated/refresh
         */
        postExtV2AuthenticatedRefresh: (data: {
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
         * @description pub用のトークンを作成
         *
         * @name PostExtV2AuthenticatedEquipmentToken
         * @summary Create Equipment Token
         * @request POST:/ext/v2/authenticated/equipmentToken
         */
        postExtV2AuthenticatedEquipmentToken: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 現場一覧取得
         *
         * @name GetExtV2AuthenticatedConstructionList
         * @summary Get Construction List
         * @request GET:/ext/v2/authenticated/construction
         */
        getExtV2AuthenticatedConstructionList: (params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 現場作成
         *
         * @name PostExtV2AuthenticatedConstruction
         * @summary Create Construction
         * @request POST:/ext/v2/authenticated/construction
         */
        postExtV2AuthenticatedConstruction: (data: {
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
         * @description 現場詳細取得
         *
         * @name GetExtV2AuthenticatedConstruction
         * @summary Get Construction
         * @request GET:/ext/v2/authenticated/construction/{constructionId}
         */
        getExtV2AuthenticatedConstruction: (constructionId: number, params?: RequestParams) => Promise<HttpResponse<{
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
         * @name PutExtV2AuthenticatedConstruction
         * @summary Update Construction
         * @request PUT:/ext/v2/authenticated/construction/{constructionId}
         */
        putExtV2AuthenticatedConstruction: (constructionId: number, data: {
            /** 工事名称 */
            name?: string;
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
         * @description 現場削除
         *
         * @name DeleteExtV2AuthenticatedConstruction
         * @summary Delete Construction
         * @request DELETE:/ext/v2/authenticated/construction/{constructionId}
         */
        deleteExtV2AuthenticatedConstruction: (constructionId: number, data: any, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 契約項目一覧取得
         *
         * @name GetExtV2AuthenticatedContractList
         * @summary Get Contract List
         * @request GET:/ext/v2/authenticated/contract
         */
        getExtV2AuthenticatedContractList: (query?: {
            /** 現場ID */
            constructionId?: number;
            /** 「createdAt」は作成日、「accessedAt」はアクセス日時の降順。「name」は契約項目名の昇順 */
            sort?: string;
            /** 現在のページ番号。perPageも設定すること */
            currentPage?: number;
            /** 1ページの表示数。currentPareも設定すること */
            perPage?: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 契約項目作成
         *
         * @name PostExtV2AuthenticatedContract
         * @summary Create Contract
         * @request POST:/ext/v2/authenticated/contract
         */
        postExtV2AuthenticatedContract: (data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 契約項目詳細取得
         *
         * @name GetExtV2AuthenticatedContract
         * @summary Get Contract
         * @request GET:/ext/v2/authenticated/contract/{contractId}
         */
        getExtV2AuthenticatedContract: (contractId: number, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 契約項目編集
         *
         * @name PutExtV2AuthenticatedContract
         * @summary Update Contract
         * @request PUT:/ext/v2/authenticated/contract/{contractId}
         */
        putExtV2AuthenticatedContract: (contractId: number, data: {
            /** 契約項目名 */
            name?: string;
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 契約項目削除
         *
         * @name DeleteExtV2AuthenticatedContract
         * @summary Delete Contract
         * @request DELETE:/ext/v2/authenticated/contract/{contractId}
         */
        deleteExtV2AuthenticatedContract: (contractId: number, data: any, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description 契約項目ファイル一覧取得
         *
         * @name GetExtV2AuthenticatedContractFileList
         * @summary Get Contract File List
         * @request GET:/ext/v2/authenticated/contractFile
         */
        getExtV2AuthenticatedContractFileList: (query: {
            /** 契約項目ID */
            contractId: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 契約項目ファイル総数 */
            total?: number;
            contractFiles?: ContractFile[];
        }, void>>;
        /**
         * @description 契約項目ファイル編集
         *
         * @name PutExtV2AuthenticatedContractFile
         * @summary Put Contract File
         * @request PUT:/ext/v2/authenticated/contractFile/{contractFileId}
         */
        putExtV2AuthenticatedContractFile: (contractFileId: string, data: {
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
        }, params?: RequestParams) => Promise<HttpResponse<ContractFile, any>>;
        /**
         * @description 契約項目ファイル削除
         *
         * @name DeleteExtV2AuthenticatedContractFile
         * @summary Delete Contract File
         * @request DELETE:/ext/v2/authenticated/contractFile/{contractFileId}
         */
        deleteExtV2AuthenticatedContractFile: (contractFileId: string, params?: RequestParams) => Promise<HttpResponse<void, any>>;
        /**
         * @description 点群アップロード
         *
         * @name PostExtV2AuthenticatedContractFilePointCloud
         * @summary Upload Point Cloud
         * @request POST:/ext/v2/authenticated/contractFile/pointCloud
         */
        postExtV2AuthenticatedContractFilePointCloud: (data: {
            /** 契約項目ID */
            contractId: number;
            /** ファイル名 */
            name: string;
            /** ファイルサイズ */
            size: number;
            pointCloudAttribute?: PointCloudAttribute_2;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 署名付きURL */
            presignedURL?: string;
            /** 契約項目ファイルID */
            contractFileId?: number;
        }, Errors>>;
        /**
         * @description ファイルアップロード完了API
         *
         * @name PutExtV2AuthenticatedContractFileUploaded
         * @summary Complete Contract File Upload
         * @request PUT:/ext/v2/authenticated/contractFile/uploaded/{contractFileId}
         */
        putExtV2AuthenticatedContractFileUploaded: (contractFileId: number, data: {
            /** 契約項目ID */
            contractId: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
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
        }, Errors>>;
        /**
         * @description 点群マルチパートアップロード(2種類のアップロードURLが返るのでそれぞれにアップロードする)
         *
         * @name PostExtV2AuthenticatedContractFilePointCloudMultipartUpload
         * @summary Multipart Upload Point Cloud
         * @request POST:/ext/v2/authenticated/contractFile/pointCloud/multipartUpload
         */
        postExtV2AuthenticatedContractFilePointCloudMultipartUpload: (data: {
            /** 契約項目ID */
            contractId: number;
            /** ファイル名 */
            name: string;
            /** ファイルサイズ */
            size: number;
            /** ファイルの分割数 */
            partTotal: number;
            pointCloudAttribute?: PointCloudAttribute_2;
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
         * @name PostExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload
         * @summary Complete Multipart Upload Point Cloud
         * @request PUT:/ext/v2/authenticated/contractFile/pointCloud/completeMultipartUpload
         */
        postExtV2AuthenticatedContractFilePointCloudCompleteMultipartUpload: (data: {
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
         * @name PostExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload
         * @summary Delete Multipart Upload Point Cloud
         * @request DELETE:/ext/v2/authenticated/contractFile/pointCloud/deleteMultipartUpload
         */
        postExtV2AuthenticatedContractFilePointCloudDeleteMultipartUpload: (data: {
            /** 契約項目ファイルID */
            contractFileId: number;
            /** S3アップロードID */
            s3UploadId: string;
            /** ブロックチェーンアップロードID */
            blockChainUploadId: string;
        }, params?: RequestParams) => Promise<HttpResponse<void, Errors>>;
        /**
         * @description ファイルダウンロードURL取得
         *
         * @name GetExtV2AuthenticatedContractFileDownloadUrl
         * @summary Download Contract File
         * @request GET:/ext/v2/authenticated/contractFile/downloadURL/{contractFileId}
         */
        getExtV2AuthenticatedContractFileDownloadUrl: (contractFileId: number, query: {
            /** 契約項目ID */
            contractId: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /** 署名付きURL */
            presignedURL?: string;
        }, Errors>>;
        /**
         * @description 処理ステータス取得
         *
         * @name GetExtV2AuthenticatedContractFileProcessingStatus
         * @summary Get Processing Status
         * @request GET:/ext/v2/authenticated/contractFile/processingStatus/{contractFileId}
         */
        getExtV2AuthenticatedContractFileProcessingStatus: (contractFileId: number, query: {
            /** 契約項目ID */
            contractId: number;
        }, params?: RequestParams) => Promise<HttpResponse<{
            /**
             * 処理ステータス
             * - pending: 保留中
             * - completed: 完了
             */
            status?: string;
        }, Errors>>;
        /**
         * @description meta取得
         *
         * @name GetExtV2AuthenticatedPclodMeta
         * @summary Get Pclod Meta
         * @request GET:/ext/v2/authenticated/pclod/meta
         */
        getExtV2AuthenticatedPclodMeta: (query: {
            /** 契約項目ID */
            contractId: number;
            /** 契約項目ファイルID */
            contractFileId: number;
        }, params?: RequestParams) => Promise<HttpResponse<File_2, Errors>>;
        /**
         * @description imagePosition取得
         *
         * @name GetExtV2AuthenticatedPclodImagePosition
         * @summary Get Pclod Image Position
         * @request GET:/ext/v2/authenticated/pclod/imagePosition
         */
        getExtV2AuthenticatedPclodImagePosition: (query: {
            /** 契約項目ID */
            contractId: number;
            /** 契約項目ファイルID */
            contractFileId: number;
            /** the level of detail */
            level: number;
            /** the coordinate of the unit in whole LOD octree */
            addr: string;
        }, params?: RequestParams) => Promise<HttpResponse<File_2, Errors>>;
        /**
         * @description imageColor取得
         *
         * @name GetExtV2AuthenticatedPclodImageColor
         * @summary Get Pclod Image Color
         * @request GET:/ext/v2/authenticated/pclod/imageColor
         */
        getExtV2AuthenticatedPclodImageColor: (query: {
            /** 契約項目ID */
            contractId: number;
            /** 契約項目ファイルID */
            contractFileId: number;
            /** the level of detail */
            level: number;
            /** the coordinate of the unit in whole LOD octree */
            addr: string;
        }, params?: RequestParams) => Promise<HttpResponse<File_2, Errors>>;
    };
}

declare interface ApiConfig<SecurityDataType = unknown> {
    baseUrl?: string;
    baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
    securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
    customFetch?: typeof fetch;
}

/**
 * batchProcessingResult
 * バッチ処理結果
 */
declare interface BatchProcessingResult {
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

declare type CancelToken = Symbol | string | number;

export declare type Chunkable = ArrayBufferLike | Uint8Array | Blob | ReadableStream<Uint8Array>;

export declare function chunkedUpload(input: Chunkable, { upload, chunkSize, onProgress }: Options): Promise<void>;

export declare type ClientProps = {
    domain?: string;
    baseUrl: string;
    clientId: string;
    clientSecret: string;
};

export declare type ClientProps3Legged = {
    /** 初回の認可コード（後から authenticate() でも可） */
    authCode: string;
} & ClientProps;

declare enum ContentType {
    Json = "application/json",
    JsonApi = "application/vnd.api+json",
    FormData = "multipart/form-data",
    UrlEncoded = "application/x-www-form-urlencoded",
    Text = "text/plain"
}

/**
 * contract
 * 契約項目
 */
declare interface Contract {
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
 * contractFile
 * 契約項目ファイル
 */
declare interface ContractFile {
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
    file?: File_2;
    /** 契約項目 */
    contract?: Contract;
    /** バッチ処理結果 */
    batchProcessingResult?: BatchProcessingResult;
}

/**
 * error
 * 正常終了以外の返却値
 */
declare interface Errors {
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
 * file
 * ファイル
 */
declare interface File_2 {
    /** ファイルID */
    id?: number;
    /** ファイルサイズ */
    size?: number;
    /** ファイル名 */
    name?: string;
}

declare interface FullRequestParams extends Omit<RequestInit, "body"> {
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

declare class HttpClient<SecurityDataType = unknown> {
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

declare interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
    data: D;
    error: E;
}

declare interface Options {
    upload: (chunk: Uint8Array, part: number, offset: number, total: number | null) => Promise<void>;
    chunkSize?: number;
    onProgress?: (sent: number, total: number | null) => void;
}

declare interface PointCloudAttribute_2 {
    no?: string;
    time?: string;
    method?: string;
    equipment?: string;
    person?: string;
    crs?: string;
}

declare type QueryParamsType = Record<string | number, any>;

/**
 * RCDE API Client for 2-legged authentication
 */
export declare class RCDEClient2Legged {
    private baseUrl;
    private clientId;
    private clientSecret;
    private api;
    private origin;
    private token?;
    constructor(props: ClientProps);
    private get headers();
    private get authHeaders();
    private get accessToken();
    private isTokenAvailable;
    authenticate(): Promise<void>;
    refreshToken(): Promise<void>;
    createEquipmentToken(data: Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedEquipmentToken"]>[0]): Promise<{
        id?: number;
        token?: string;
        expiredAt?: string;
        isExpired?: boolean;
    }>;
    getConstructionList(): Promise<{
        total?: number;
        constructions?: {
            id?: number;
            name?: string;
            address?: string;
            contractedAt?: string;
            period?: string;
            advancePaymentRate?: number;
            contractAmount?: number;
        }[];
    }>;
    createConstruction(data: Omit<Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedConstruction"]>[0], "period" | "contractedAt"> & {
        period: Date;
        contractedAt: Date;
    }): Promise<{
        id?: number;
        name?: string;
        address?: string;
        contractedAt?: string;
        period?: string;
        advancePaymentRate?: number;
        contractAmount?: number;
    }>;
    getConstruction(constructionId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedConstruction"]>[0]): Promise<{
        id?: number;
        name?: string;
        address?: string;
        contractedAt?: string;
        period?: string;
        advancePaymentRate?: number;
        contractAmount?: number;
    }>;
    updateConstruction(constructionId: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedConstruction"]>[0], data: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedConstruction"]>[1]): Promise<{
        id?: number;
        name?: string;
        address?: string;
        contractedAt?: string;
        period?: string;
        advancePaymentRate?: number;
        contractAmount?: number;
    }>;
    deleteConstruction(constructionId: Parameters<Api<unknown>["ext"]["deleteExtV2AuthenticatedConstruction"]>[0]): Promise<void>;
    getContractList(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractList"]>[0]): Promise<{
        total?: number;
        contracts?: {
            id?: number;
            name?: string;
            unitPrice?: number;
            unitVolume?: number;
            contractedAt?: string;
            createdAt?: string;
            status?: number;
        }[];
    }>;
    createContract(data: Omit<Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedContract"]>[0], "contractedAt"> & {
        contractedAt: Date;
    }): Promise<{
        id?: number;
        name?: string;
        unitPrice?: number;
        unitVolume?: number;
        contractedAt?: string;
        status?: number;
    }>;
    getContract(contractId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContract"]>[0]): Promise<{
        id?: number;
        name?: string;
        unitPrice?: number;
        unitVolume?: number;
        contractedAt?: string;
        createdAt?: string;
        status?: number;
    }>;
    updateContract(contractId: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContract"]>[0], data: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContract"]>[1]): Promise<{
        id?: number;
        name?: string;
        unitPrice?: number;
        unitVolume?: number;
        contractedAt?: string;
        createdAt?: string;
        status?: number;
    }>;
    deleteContract(contractId: Parameters<Api<unknown>["ext"]["deleteExtV2AuthenticatedContract"]>[0]): Promise<void>;
    getContractFileList(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileList"]>[0]): Promise<{
        total?: number;
        contractFiles?: ContractFile_2[];
    }>;
    getContractFileMetadata(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodMeta"]>[0]): Promise<File_3>;
    getContractFileImagePosition(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImagePosition"]>[0]): Promise<File_3>;
    getContractFileImageColor(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImageColor"]>[0]): Promise<File_3>;
    private createContractFileUploadUrl;
    private completeContractFileUpload;
    uploadContractFile(data: Omit<Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedContractFilePointCloud"]>[0], "size"> & {
        buffer: ArrayBuffer | Blob;
        size?: number;
    }): Promise<{
        id?: number;
        name?: string;
        category?: number;
        status?: number;
        fileCheckStatus?: number;
        createdAt?: string;
        updatedAt?: string;
        uploadedAt?: string;
    }>;
    getContractFileDownloadUrl(contractId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileDownloadUrl"]>[1]["contractId"], contractFileId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileDownloadUrl"]>[0]): Promise<{
        presignedURL?: string;
    }>;
    getContractFileProcessingStatus(contractId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileProcessingStatus"]>[1]["contractId"], contractFileId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileProcessingStatus"]>[0]): Promise<{
        status?: string;
    }>;
}

/**
 * RCDE API Client (3-legged)
 * - リフレッシュ: POST /ext/v2/oauth/token + grant_type=refresh_token
 * - 自動リフレッシュ内蔵（期限の60秒前で更新）
 * - トークン永続化は利用側（setToken/getToken で入出力）
 */
export declare class RCDEClient3Legged {
    private baseUrl;
    private clientId;
    private clientSecret;
    private api;
    private origin;
    private token?;
    constructor(props: ClientProps3Legged);
    private get headers();
    setToken(token: Token): void;
    getToken(): Token;
    authenticate(authCode: string): Promise<void>;
    private needsRefresh;
    refreshToken(): Promise<void>;
    private ensureValidAccessToken;
    private getAuthHeaders;
    private isTokenAvailable;
    getContractFileProcessingStatus(contractFileId: number): Promise<{
        status?: string;
    }>;
    uploadContractFileMultipart(params: {
        contractId: number;
        file: Chunkable | File;
        filename: string;
        chunkSize?: number;
        onProgress?: (uploaded: number, total: number | null) => void;
    }): Promise<void>;
}

declare type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

declare type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export declare type Token = {
    accessToken: string;
    refreshToken: string;
    /** 有効期限（秒 since epoch） */
    expiresAt: number;
};

export { }
