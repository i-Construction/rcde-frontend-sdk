import { Api } from "./api-2-legged";
import { ClientProps } from "./common";
/**
 * RCDE API Client for 2-legged authentication
 */
declare class RCDEClient2Legged {
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
        contractFiles?: import("./api-2-legged").ContractFile[];
    }>;
    getContractFileMetadata(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodMeta"]>[0]): Promise<import("./api-2-legged").File>;
    getContractFileImagePosition(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImagePosition"]>[0]): Promise<import("./api-2-legged").File>;
    getContractFileImageColor(query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImageColor"]>[0]): Promise<import("./api-2-legged").File>;
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
export { RCDEClient2Legged };
