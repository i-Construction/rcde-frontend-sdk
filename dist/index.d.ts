import { Box3 } from 'three';
import { CanvasProps } from '@react-three/fiber';
import { Dispatch } from 'react';
import { FC } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { PointCloudMeta } from '@i-con/pcd-viewer';
import { ReactNode } from 'react';
import { SetStateAction } from 'react';
import { Vector3 } from 'three';

export declare type AuthType = "2legged" | "3legged";

/**
 * R-CDE（rcde リポジトリ）の PCLOD バッチ処理ステータスのミラー。
 *
 * 正本: `server/pkg/ent/schema/batchprocessingresult.go` の `BatchProcessingResultStatus`。
 * R-CDE 側で値を追加・変更したら、本ファイルと `PclodStatus`（contractFileStatus.ts）を同じタイミングで
 * 更新する。SDK 単独で値を発明しない。
 */
export declare const BATCH_PROCESSING_STATUS: {
    /** 開始 */
    readonly start: 1;
    /** 進行中 */
    readonly inProgress: 2;
    /** 完了 */
    readonly finish: 3;
    /** 失敗（PCLOD ジョブが error.json を出力した） */
    readonly failed: 4;
};

/**
 * PCLOD バッチ処理の結果。`status` の値集合は R-CDE の BatchProcessingResultStatus と 1 対 1 で、
 * SDK が独自の値を混ぜることはない。R-CDE が SDK の知らない値を返したときだけ `status` が undefined になる。
 * `rawStatus` は R-CDE が返した数値そのもので、常に読める（`status` が undefined のときの調査に使う）。
 */
export declare type BatchProcessingResult = {
    id: number;
    status?: BatchProcessingStatus;
    rawStatus: number;
};

export declare type BatchProcessingStatus = (typeof BATCH_PROCESSING_STATUS)[keyof typeof BATCH_PROCESSING_STATUS];

export declare type ClientContextType = {
    client?: RCDEClient;
    initialize: (app: RCDEAppConfig) => void;
    project?: {
        constructionId: number;
        contractId: number;
    };
    setProject: Dispatch<SetStateAction<ClientContextType["project"]>>;
};

export declare const ClientProvider: FC<{
    children: ReactNode;
}>;

export declare type Command = {
    type: "SET_TRANSFORM";
    payload: ViewerTransform;
} | {
    type: "SET_APPEARANCE";
    payload: ViewerAppearance;
} | {
    type: "RESET";
};

declare type Construction = {
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

declare type Contract = {
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

export declare type ContractFile = {
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

export declare type ContractFileActions = {
    /** 登録済みファイルとアップロード中ファイルをマージした一覧行 */
    rows: ContractFileRow[];
    /** 表示/非表示を切り替える */
    toggleVisibility: (container: ContractFileContainer) => void;
    /**
     * 指定ファイルのバウンディングボックス中心へ基準点を移動してフォーカスする。
     * 成功した場合は `true`、対象なし・未完了・失敗時は `false` を返す。
     */
    focusFile: (file: ContractFile) => Promise<boolean>;
    /**
     * ダウンロード用の署名付きURLを取得して別タブで開く。
     * 別タブを開いた場合は `true`、URL 取得失敗・無効 URL・前提不足時は `false` を返す。
     */
    downloadFile: (file: ContractFile) => Promise<boolean>;
    /**
     * アップロード/PCLOD の状態を導出する。
     * アップロード中判定はフックが保持する `pendingUploads` から内部で行う。
     */
    getFileStatus: (file: ContractFile) => FileStatus;
    /** PCLOD 処理が完了しているか */
    isPclodCompleted: (file: ContractFile) => boolean;
};

export declare type ContractFileContainer = {
    file: ContractFile;
    visible: boolean;
};

export declare type ContractFileProps = {
    file: ContractFile;
    meta: PointCloudMeta;
    referencePoint?: Vector3;
    selected?: boolean;
    translation: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    inspectorPointSize?: number;
    inspectorOpacity?: number;
    inspectorCoordinateSystem?: CoordinateSystemType;
    onMemoryEstimateChange?: (estimate: ViewerFileMemoryEstimate) => void;
};

/** ファイル一覧の1行分のデータ（登録済みファイル or アップロード中） */
export declare type ContractFileRow = {
    type: "container";
    container: ContractFileContainer;
} | {
    type: "pending";
    contractFileId: number;
    name: string;
};

export declare type ContractFiles = ContractFile[];

declare type ContractFilesContextType = {
    containers: ContractFileContainer[];
    load: (files: ContractFiles, visibleIds?: number[]) => void;
    /**
     * 再取得した一覧でファイルの中身を差し替える。表示・非表示は ID で前回の状態を引き継ぐ。
     * 前回に無かったファイルは、直近の load で適用した visibleIds に従う。
     * load を一度も呼んでいなければ visibleIds は未指定の扱いになり、全件が表示になる。
     */
    updateFiles: (files: ContractFiles) => void;
    toggleVisibility: (container: ContractFileContainer) => void;
};

export declare const ContractFilesProvider: FC<{
    children: ReactNode;
}>;

export declare const ContractFileView: ({ file, meta, referencePoint, selected, translation, rotation, inspectorPointSize, inspectorOpacity, inspectorCoordinateSystem, onMemoryEstimateChange, }: ContractFileProps) => JSX_2.Element | null;

export declare const CoordinateSystem: {
    readonly RightHandedXUp: "RIGHT_HANDED_X_UP";
    readonly LeftHandedXUp: "LEFT_HANDED_X_UP";
    readonly RightHandedYUp: "RIGHT_HANDED_Y_UP";
    readonly LeftHandedYUp: "LEFT_HANDED_Y_UP";
    readonly RightHandedZUp: "RIGHT_HANDED_Z_UP";
    readonly LeftHandedZUp: "LEFT_HANDED_Z_UP";
};

export declare type CoordinateSystemType = (typeof CoordinateSystem)[keyof typeof CoordinateSystem];

declare type CreateConstructionParams = {
    name: string;
    address?: string;
    contractedAt?: string;
    period?: string;
    contractAmount?: number;
    advancePaymentRate?: number;
};

export declare function deriveFileStatus(file: ContractFile, isPendingUpload: boolean): FileStatus;

export declare type FileStatus = {
    upload: UploadStatus;
    pclod: PclodStatus;
};

/** R-CDE と SDK の値集合が揃っているか（＝受け取った値が既知のステータスか）を判定する */
export declare function isBatchProcessingStatus(rawStatus: unknown): rawStatus is BatchProcessingStatus;

/** ポーリングを続ける必要があるか。failed / unknown は確定状態なので止める */
export declare function isFileStatusActive(status: FileStatus): boolean;

export declare function isPclodCompleted(file: ContractFile): boolean;

declare type Json = Record<string, unknown>;

export declare const MeasurementHandler: FC<MeasurementHandlerProps>;

export declare type MeasurementHandlerProps = {
    onChange?: (points: Vector3[]) => void;
    externalAppEditedPoints?: Vector3[];
    /**
     * 計測モードの有効/無効。`false` のときイベントを遮断せず、
     * ClickHandler や実装者のリスナーが正常に動作する。
     * @default true
     */
    isActive?: boolean;
};

export declare const MeasurementView: FC<MeasurementViewProps>;

declare type MeasurementViewProps = {
    points?: Vector3[];
    referencePoint?: Vector3;
    edit?: boolean;
};

/**
 * PCLOD 処理の状態。R-CDE の BatchProcessingResultStatus と対になる（batchProcessingStatus.ts）。
 * `unknown` は R-CDE と SDK の値集合がずれたときだけ現れる異常系で、SDK の追随漏れを示す。
 */
export declare type PclodStatus = "none" | "waiting" | "processing" | "completed" | "failed" | "unknown";

export declare type PendingUpload = {
    name: string;
};

export declare type PendingUploads = Record<number, PendingUpload>;

declare type PointCloudMultipartUploadParams = PointCloudUploadParams & {
    chunkSize?: number;
    onUploadProgress?: (completedParts: number, totalParts: number) => void;
};

declare type PointCloudUploadParams = {
    contractId: number;
    name: string;
    buffer: ArrayBuffer;
    pointCloudAttribute?: Record<string, unknown>;
    onContractFileCreated?: (contractFileId: number) => void;
};

declare type R3FProps = {
    canvas?: CanvasProps;
    map?: boolean;
    light?: boolean;
    grid?: boolean;
    gizmo?: boolean;
    referencePointAxis?: boolean;
};

/**
 * Root component for RCDE
 *
 * @example
 * ```tsx
 * <RCDE constructionId={1} contractId={1} app={app}>
 *   <YourR3FComponentInTheViewerScene />
 * </RCDE>
 * ```
 */
export declare const RCDE: FC<ViewerProps>;

/**
 * MeasurementHandler がクリックを消費済みであることを示すフラグ。
 * stopImmediatePropagation の代わりにイベントオブジェクトへ付与し、
 * 実装者のリスナーを巻き込まずに SDK 内部の ClickHandler のみ抑制する。
 */
export declare const RCDE_CLICK_HANDLED = "__rcde_measurement_handled";

/**
 * R-CDE API へ接続するためのアプリケーション設定。
 *
 * `Viewer` と `ClientProvider` の双方が参照する。
 * どちらかのモジュールに置くと components と contexts が相互に import し合う
 * 循環になるため、依存を持たない型モジュールに置く。
 */
export declare type RCDEAppConfig = {
    token: string;
    baseUrl?: string;
    authType?: AuthType;
};

export declare class RCDEClient {
    private baseUrl;
    private token?;
    private authType;
    private fetchImpl;
    constructor(opts?: RCDEClientOptions);
    private headers;
    private getApiPath;
    /** R-CDE の応答を JSON として読む。失敗は sendRcdeRequest 側。T は検証せず信じた形。parse は呼び出し側 */
    private requestJson;
    /** R-CDE の応答をバイナリのまま読む。点群タイル画像はここを通す（JSON へ寄せると読めなくなる） */
    private requestArrayBuffer;
    getContractFileList(params: {
        contractId: number;
    }): Promise<{
        contractFiles: ContractFile[];
    }>;
    getContractFileMetadata(params: {
        contractId: number;
        contractFileId: number;
    }): Promise<Json>;
    getContractFileImagePosition(params: {
        contractId: number;
        contractFileId: number;
        level?: number;
        addr?: string;
    }): Promise<ArrayBuffer>;
    getContractFileImageColor(params: {
        contractId: number;
        contractFileId: number;
        level?: number;
        addr?: string;
    }): Promise<ArrayBuffer>;
    getContractFileDownloadUrl(contractId: number, fileId: number): Promise<{
        presignedURL: string;
        url: string;
    }>;
    uploadContractFile(params: PointCloudUploadParams): Promise<Json>;
    uploadContractFileMultipart(params: PointCloudMultipartUploadParams): Promise<{
        contractFileId: number;
    }>;
    getConstructionList(): Promise<{
        constructions: Construction[];
    }>;
    getConstruction(constructionId: number): Promise<Construction>;
    createConstruction(params: CreateConstructionParams): Promise<Json>;
    getContractList(params: {
        constructionId: number;
    }): Promise<{
        contracts: Contract[];
    }>;
    /**
     * 契約を作成する。2legged のみ対応。
     *
     * status は受け取らない。R-CDE の契約作成 API（ContractCreateFor2LeggedParams /
     * ContractCreateFor3LeggedParams）に status フィールドが無く、送っても echo の Bind が捨てるため。
     * 作成直後の状態は R-CDE 側が決める（2-legged は受注者がダミーなので承認済みまで自動で進む）。
     *
     * 3legged はリクエストを組み立てる前に落とす。R-CDE の ContractCreateFor3LeggedParams は
     * contracteeEmail / contractorEmail のどちらか一方を必須にし（required_without の相互指定）、
     * さらにどちらを渡したかで呼び出し元が受注者か注文者かまで変わる。この分岐を表せる引数を
     * まだ持たないので、送っても必ず 400 になる。飛ばしてから失敗させると呼び出し側には
     * R-CDE 側の入力不備と区別が付かないため、SDK 側の未対応であることが分かる形で止める。
     */
    createContract(params: {
        constructionId: number;
        name: string;
        /**
         * 契約日。ISO 8601 の日時で渡す（例: `2024-11-19T06:56:31Z`）。
         *
         * R-CDE 側は time.Time なので、echo の Bind は RFC3339 しか解釈しない。`2024-11-19` のような
         * 日付だけの文字列は検証より前の Bind で落ちて 400 になる。
         */
        contractedAt: string;
        /**
         * 単価。1 以上を渡す。
         *
         * R-CDE 側は uint64 かつ validate:"required" で、validator はゼロ値を「未指定」として扱う。
         * そのため 0 は省略と同じ扱いになり 400 になる。SDK 側では弾かず、値域の判断は R-CDE に委ねる。
         */
        unitPrice: number;
        /** 数量。1 以上を渡す。0 が使えない理由は unitPrice と同じ。 */
        unitVolume: number;
    }): Promise<Json>;
}

export declare type RCDEClientOptions = {
    baseUrl?: string;
    accessToken?: string;
    authType?: AuthType;
    fetchImpl?: typeof fetch;
};

export declare type RCDEProps = Parameters<typeof RCDE>[0];

/**
 * 基準点軸コンポーネント
 *
 * 基準点（シフト後ワールド原点）に X/Y/Z 軸矢印を表示する。
 * - X 軸: 赤
 * - Y 軸: 緑
 * - Z 軸: 青
 *
 * 点群座標には `useReferencePoint` の `point` が加算されるため、
 * 基準点そのものは常にワールド原点に留まる。軸も原点に固定描画する。
 *
 * @example
 * ```tsx
 * <ReferencePointAxis length={15} width={0.3} />
 * ```
 */
export declare const ReferencePointAxis: FC<ReferencePointAxisProps>;

/**
 * 基準点軸コンポーネントの props
 */
export declare type ReferencePointAxisProps = {
    /**
     * 軸矢印の長さ（ワールド単位）
     * @default 10
     */
    length?: number;
    /**
     * 軸矢印の太さ
     * @default 0.2
     */
    width?: number;
    /**
     * 軸を表示するかどうか
     * @default true
     */
    visible?: boolean;
};

/**
 * Context provider props for reference point.
 * `Reference point` is the positional offset to the center of the selected point cloud.
 */
declare type ReferencePointContextType = {
    point: Vector3;
    change: (point: Vector3) => void;
    /**
     * 指定ファイルの Bounding Box 中心へ基準点を移動する。
     * 成功時は `true`、対象なし・PCLOD 未完了・メタデータ取得失敗時は `false` を返す。
     */
    focusFileById: (fileId: number) => Promise<boolean>;
};

export declare const ReferencePointProvider: FC<{
    children: ReactNode;
}>;

export declare type UpAxis = "Y" | "Z";

export declare type UploadStatus = "uploading" | "uploaded";

export declare const useClient: () => ClientContextType;

/**
 * レフト/ライトサイドバーのファイル一覧が持っていた機能を UI から切り離したフック。
 *
 * ファイル一覧行の生成、表示切替、フォーカス、ダウンロード、ステータス判定を提供する。
 * 呼び出し元が任意の UI を組んで利用する。
 *
 * @remarks
 * `ClientProvider` / `ContractFilesProvider` / `ReferencePointProvider` の配下でのみ利用できる
 * （例: `RCDE` コンポーネントの `children` / `auxiliaryContent`、または各 Provider を自前で構成した
 * ツリー）。プロバイダ外で呼ぶと各コンテキストが throw する。RCDE 利用時のマウント先は
 * `auxiliaryContent` になるためキャンバスへの重ね描きになる。ビューアと横並びにしたい場合は
 * `Viewer` と各 Provider を自前で組む必要がある。
 *
 * @example
 * ```tsx
 * const { rows, toggleVisibility, focusFile, downloadFile, getFileStatus, isPclodCompleted } =
 *   useContractFileActions(pendingUploads);
 * ```
 */
export declare const useContractFileActions: (pendingUploads?: PendingUploads) => ContractFileActions;

export declare const useContractFiles: () => ContractFilesContextType;

/**
 * Hooks to use reference point
 *
 * @example
 * ```tsx
 * const { point, change, focusFileById } = useReferencePoint();
 * ```
 *
 * @returns Reference point context
 */
export declare const useReferencePoint: () => ReferencePointContextType;

export declare const Viewer: FC<ViewerProps>;

export declare type ViewerAppearance = {
    pointSize: number;
    opacity: number;
    upAxis?: UpAxis;
    coordinateSystem?: CoordinateSystemType;
    fileId?: number;
};

export declare const ViewerBridge: {
    setTransform(tx: ViewerTransform): void;
    setAppearance(app: ViewerAppearance): void;
    reset(): void;
    addListener(handler: (cmd: Command) => void): () => void;
};

/**
 * 3D ビューア上のクリックイベント。
 *
 * - `hit: true` — オブジェクト（ContractFile のバウンディングボックス）がクリックされた。
 * - `hit: false` — 空白がクリックされた（選択解除に利用可能）。
 *
 * ### 座標系
 * - `boundingBox` はメタデータの生座標（基準点オフセット未適用）。`onContractFileClick` と同一。
 * - `intersectionPoint` は基準点オフセット適用済みのワールド座標。
 * - `localIntersectionPoint` は基準点オフセット未適用の座標。`boundingBox` と同じ座標系。
 * - `screenPosition` はビューポート座標（`MouseEvent.clientX/clientY`）。
 *   キャンバス相対座標が必要な場合は `canvas.getBoundingClientRect()` で変換してください。
 *
 * ### 制限事項
 * `RCDE_VIEWER_CMD` (`SET_TRANSFORM`) によるファイル個別の translation / rotation は
 * 当たり判定に反映されません。移動・回転されたファイルの判定は元の位置の boundingBox に
 * 基づきます。この制限は `onContractFileClick` と同一です。
 */
export declare type ViewerClickEvent = {
    hit: true;
    file: ContractFile;
    boundingBox: Box3;
    /** 基準点オフセット適用済みのワールド座標 */
    intersectionPoint: Vector3;
    /** 基準点オフセット未適用の座標（boundingBox と同じ座標系） */
    localIntersectionPoint: Vector3;
    /** ビューポート座標（clientX/clientY） */
    screenPosition: {
        x: number;
        y: number;
    };
} | {
    hit: false;
    /** ビューポート座標（clientX/clientY） */
    screenPosition: {
        x: number;
        y: number;
    };
};

export declare type ViewerFileMemoryEstimate = {
    fileId: number;
    loadedTileCount: number;
    compressedBytes: number;
    decodedBytes: number;
    totalBytes: number;
};

/**
 * 3D ビューア上のホバーイベント（enter/leave セマンティクス）。
 *
 * ホバー対象のオブジェクトが**変わったとき**のみ発火します。
 * 同一オブジェクト上でカーソルが移動しても `screenPosition` は更新されません。
 * カーソル追従が必要な場合は、利用側で別途 `mousemove` をリスンしてください。
 *
 * - `hit: true` — オブジェクトにカーソルが入った。
 * - `hit: false` — カーソルがオブジェクトから外れた、またはキャンバス外に出た。
 *
 * ### 座標系
 * - `boundingBox` はメタデータの生座標（基準点オフセット未適用）。
 * - `screenPosition` はビューポート座標（`MouseEvent.clientX/clientY`）。
 *
 * ### 制限事項
 * `RCDE_VIEWER_CMD` (`SET_TRANSFORM`) によるファイル個別の translation / rotation は
 * 当たり判定に反映されません。この制限は `onContractFileClick` と同一です。
 */
export declare type ViewerHoverEvent = {
    hit: true;
    file: ContractFile;
    boundingBox: Box3;
    /** ビューポート座標（clientX/clientY） */
    screenPosition: {
        x: number;
        y: number;
    };
} | {
    hit: false;
};

export declare type ViewerMemoryAlert = {
    /** `breaches` のうち最も高いレベル。 */
    level: ViewerMemoryAlertLevel;
    /** 深刻な超過が先頭に来るよう並べ替え済み。 */
    breaches: ViewerMemoryThresholdBreach[];
    observedBytes: ViewerMemoryObservedBytes;
    sample: ViewerMemorySample;
};

export declare type ViewerMemoryAlertLevel = "warning" | "critical";

/** 対象ごとの現在レベル。ヒステリシス判定に使うため対象単位で保持する。 */
export declare type ViewerMemoryAlertLevels = {
    [Target in ViewerMemoryThresholdTarget]?: ViewerMemoryAlertLevel;
};

export declare type ViewerMemoryMonitoringOptions = {
    enabled?: boolean;
    sampleIntervalMs?: number;
    thresholds?: ViewerMemoryThresholds;
    onSample?: (sample: ViewerMemorySample) => void;
    onAlert?: (alert: ViewerMemoryAlert) => void;
    onAlertLevelChange?: (level: ViewerMemoryAlertLevel | undefined, sample: ViewerMemorySample) => void;
};

/**
 * 1 サンプルで観測できたメモリ量。
 *
 * `estimateBytes` は常に得られるが、`jsHeapBytes` / `pageBytes` はブラウザが
 * 対応していない場合に undefined になる。
 */
export declare type ViewerMemoryObservedBytes = {
    estimateBytes: number;
    jsHeapBytes?: number;
    pageBytes?: number;
};

export declare type ViewerMemorySample = {
    timestamp: number;
    source: ViewerMemorySource;
    estimatedViewerBytes: number;
    pageBytes?: number;
    pageBytesMeasuredAt?: number;
    jsHeapBytes?: number;
    loadedFileCount: number;
    loadedTileCount: number;
    compressedBytes: number;
    decodedBytes: number;
    geometryCount?: number;
    textureCount?: number;
    visibleFileIds: number[];
};

export declare type ViewerMemorySource = "estimate" | "js-heap" | "browser-precise";

export declare type ViewerMemoryThreshold = {
    warningBytes?: number;
    criticalBytes?: number;
    hysteresisBytes?: number;
};

export declare type ViewerMemoryThresholdBreach = {
    target: ViewerMemoryThresholdTarget;
    level: ViewerMemoryAlertLevel;
    thresholdBytes: number;
    observedBytes: number;
};

/** 対象ごとに独立した閾値。指定した対象だけが判定され、省略した対象は無視される。 */
export declare type ViewerMemoryThresholds = {
    [Target in ViewerMemoryThresholdTarget]?: ViewerMemoryThreshold;
};

/** 閾値判定の対象。サンプルごとに 3 値すべてを観測し、設定された対象だけを判定する。 */
export declare type ViewerMemoryThresholdTarget = "estimate" | "jsHeap" | "page";

export declare type ViewerProps = {
    app: RCDEAppConfig;
    constructionId: number;
    contractId: number;
    /**
     * 初回ロード時に表示するファイルの ID。省略すると全ファイルを表示する。
     *
     * 適用されるのは初回ロード時（contractId を切り替えた直後のロードを含む）のみで、
     * 以降にこの prop を差し替えても表示状態は変わらない。ロード後の表示・非表示は
     * ユーザーの切り替え操作を優先し、contractFilesRefetchKey による再取得でも保たれる。
     */
    contractFileIds?: number[];
    r3f?: R3FProps;
    children?: ReactNode;
    positionOffsetComponent?: ReactNode;
    auxiliaryContent?: ReactNode;
    contractFilesRefetchKey?: number;
    selectedFileId?: number;
    onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
    onObjectClick?: (event: ViewerClickEvent) => void;
    onObjectHover?: (event: ViewerHoverEvent) => void;
    memoryMonitoring?: ViewerMemoryMonitoringOptions;
    /**
     * `false` を渡すとクリックイベントによるオブジェクト選択を無効化する。
     * 計測モード中に実装者側で明示的に無効化する用途。
     * @default true
     */
    clickEnabled?: boolean;
};

export declare type ViewerTransform = {
    translation: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    fileId: number;
};

export { }
