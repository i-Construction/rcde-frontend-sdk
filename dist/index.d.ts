import { Actor } from 'xstate';
import { ActorOptions } from 'xstate';
import { AnyActorRef } from 'xstate';
import { AnyEventObject } from 'xstate';
import { Box3 } from 'three';
import { CanvasProps } from '@react-three/fiber';
import { ColorRepresentation } from 'three';
import { Context } from 'react';
import { Dispatch } from 'react';
import { EventObject } from 'xstate';
import { FC } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { MachineContext } from 'xstate';
import { MachineSnapshot } from 'xstate';
import { MetaObject } from 'xstate';
import { NonReducibleUnknown } from 'xstate';
import { ParameterizedObject } from 'xstate';
import { Plane } from 'three';
import { PointCloudMeta } from 'pcd-viewer';
import { ProvidedActor } from 'xstate';
import { ReactNode } from 'react';
import { SetStateAction } from 'react';
import { StateMachine } from 'xstate';
import { StateValue } from 'xstate';
import { Vector3 } from 'three';

export declare type AuthType = '2legged' | '3legged';

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

export declare const ClippingPlanesContext: Context<ClippingPlanesContextProps>;

export declare type ClippingPlanesContextProps = {
    clippingPlanes: Plane[];
    setClippingPlanes: Dispatch<SetStateAction<Plane[]>>;
};

export declare const ClippingPlanesProvider: FC<{
    children?: ReactNode;
}>;

export declare type Command = {
    type: 'SET_TRANSFORM';
    payload: ViewerTransform;
} | {
    type: 'SET_APPEARANCE';
    payload: ViewerAppearance;
} | {
    type: 'RESET';
};

declare type Construction = {
    id: number;
    name: string;
    address?: string;
    contractedAt?: string;
    period?: string;
    contractAmount?: number;
    advancePaymentRate?: number;
};

declare type Contract = {
    id: number;
    name: string;
    contractedAt?: string;
    status?: string;
};

export declare type ContractFile = ContractFiles[number];

declare type ContractFile_2 = {
    id: number;
    name: string;
    status?: string;
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
};

export declare type ContractFiles = NonNullable<Awaited<ReturnType<RCDEClient["getContractFileList"]>>["contractFiles"]>;

declare type ContractFilesContextType = {
    containers: ContractFileContainer[];
    load: (files: ContractFiles, visibleIds?: number[]) => void;
    toggleVisibility: (container: ContractFileContainer) => void;
};

export declare const ContractFilesProvider: FC<{
    children: ReactNode;
}>;

export declare const ContractFileView: ({ file, meta, referencePoint, selected, }: ContractFileProps) => JSX_2.Element | null;

declare type CreateConstructionParams = {
    name: string;
    address?: string;
    contractedAt?: string;
    period?: string;
    contractAmount?: number;
    advancePaymentRate?: number;
};

export declare const CrossSectionHandler: FC;

export declare const CrossSectionPlane: FC<{
    size: number;
    color?: ColorRepresentation;
    opacity?: number;
}>;

export declare const GlobalStateContext: {
    useSelector: <T>(selector: (snapshot: MachineSnapshot<MachineContext, AnyEventObject, Record<string, AnyActorRef>, StateValue, string, NonReducibleUnknown, MetaObject, any>) => T, compare?: ((a: T, b: T) => boolean) | undefined) => T;
    useActorRef: () => Actor<StateMachine<MachineContext, AnyEventObject, Record<string, AnyActorRef>, ProvidedActor, ParameterizedObject, ParameterizedObject, string, StateValue, string, unknown, NonReducibleUnknown, EventObject, MetaObject, any>>;
    Provider: (props: {
        children: React.ReactNode;
        options?: ActorOptions<StateMachine<MachineContext, AnyEventObject, Record<string, AnyActorRef>, ProvidedActor, ParameterizedObject, ParameterizedObject, string, StateValue, string, unknown, NonReducibleUnknown, EventObject, MetaObject, any>> | undefined;
        machine?: never;
        logic?: StateMachine<MachineContext, AnyEventObject, Record<string, AnyActorRef>, ProvidedActor, ParameterizedObject, ParameterizedObject, string, StateValue, string, unknown, NonReducibleUnknown, EventObject, MetaObject, any> | undefined;
    }) => React.ReactElement<any, any>;
};

declare type Json = Record<string, unknown>;

export declare const MeasurementContext: Context<MeasurementContextProps>;

export declare type MeasurementContextProps = {
    points: Vector3[];
    setPoints: Dispatch<SetStateAction<Vector3[]>>;
    isActive: boolean;
    setIsActive: Dispatch<SetStateAction<boolean>>;
};

export declare const MeasurementHandler: FC<MeasurementHandlerProps>;

export declare type MeasurementHandlerProps = {
    onChange?: (points: Vector3[]) => void;
    externalAppEditedPoints?: Vector3[];
};

export declare const MeasurementProvider: FC<{
    children?: ReactNode;
}>;

export declare const MeasurementView: FC<MeasurementViewProps>;

declare type MeasurementViewProps = {
    points?: Vector3[];
    referencePoint?: Vector3;
    edit?: boolean;
};

declare type R3FProps = {
    canvas?: CanvasProps;
    map?: boolean;
    light?: boolean;
    grid?: boolean;
    gizmo?: boolean;
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

export declare type RCDEAppConfig = {
    token: string;
    baseUrl?: string;
    authType?: '2legged' | '3legged';
};

export declare class RCDEClient {
    private baseUrl;
    private token?;
    private authType;
    private fetchImpl;
    constructor(opts?: RCDEClientOptions);
    private headers;
    private getApiPath;
    getContractFileList(params: {
        contractId: number;
    }): Promise<{
        contractFiles: ContractFile_2[];
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
    uploadContractFile(params: {
        contractId: number;
        name: string;
        buffer: ArrayBuffer;
        pointCloudAttribute?: Record<string, unknown>;
    }): Promise<Json>;
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
    createContract(params: {
        constructionId: number;
        name: string;
        contractedAt: string;
        status?: string;
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
 * Reference Point Axis Component
 *
 * Displays X/Y/Z axis arrows at the reference point position
 * - X axis: Red
 * - Y axis: Green
 * - Z axis: Blue
 *
 * @example
 * ```tsx
 * <ReferencePointAxis length={15} width={0.3} point={new Vector3(0, 0, 0)} />
 * ```
 */
export declare const ReferencePointAxis: FC<ReferencePointAxisProps>;

/**
 * Reference point axis component props
 */
export declare type ReferencePointAxisProps = {
    /**
     * Length of the axis arrows in world units
     * @default 10
     */
    length?: number;
    /**
     * Width of the axis arrows
     * @default 0.2
     */
    width?: number;
    /**
     * Whether to show the axis
     * @default true
     */
    visible?: boolean;
    /**
     * Reference point position to display the axis at
     * If not provided, the axis will not be displayed
     */
    point?: Vector3 | {
        x: number;
        y: number;
        z: number;
    } | null;
};

/**
 * Context provider props for reference point.
 * `Reference point` is the positional offset to the center of the selected point cloud.
 */
declare type ReferencePointContextType = {
    point: Vector3 | null;
    change: (point: Vector3) => void;
    save: (point: Vector3) => void;
    focusFileById: (fileId: number) => Promise<void>;
};

export declare const ReferencePointProvider: FC<{
    children: ReactNode;
}>;

export declare type UpAxis = 'Y' | 'Z';

export declare const useClient: () => ClientContextType;

export declare const useClippingPlanes: () => ClippingPlanesContextProps;

export declare const useContractFiles: () => ContractFilesContextType;

export declare const useMeasurement: () => MeasurementContextProps;

/**
 * Hooks to use reference point
 *
 * @example
 * ```tsx
 * const { point, change, save, focusFileById } = useReferencePoint();
 * ```
 *
 * @returns Reference point context
 */
export declare const useReferencePoint: () => ReferencePointContextType;

export declare const Viewer: FC<ViewerProps>;

export declare type ViewerAppearance = {
    pointSize: number;
    opacity: number;
    upAxis: UpAxis;
};

export declare const ViewerBridge: {
    setTransform(tx: ViewerTransform): void;
    setAppearance(app: ViewerAppearance): void;
    reset(): void;
    addListener(handler: (cmd: Command) => void): () => void;
};

export declare type ViewerProps = {
    app: RCDEAppConfig;
    constructionId: number;
    contractId: number;
    contractFileIds?: number[];
    r3f?: R3FProps;
    children?: React.ReactNode;
    positionOffsetComponent?: React.ReactNode;
    showLeftSider?: boolean;
    showRightSider?: boolean;
    selectedFileId?: number;
    onContractFileClick?: (file: ContractFile | undefined, boundingBox: Box3 | undefined) => void;
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
};

export { }
