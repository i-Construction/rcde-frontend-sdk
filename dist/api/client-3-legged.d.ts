import { ClientProps } from "./common";
import { Chunkable } from "./chunk-uploader";
type ClientProps3Legged = {
    /** 初回の認可コード（後から authenticate() でも可） */
    authCode: string;
} & ClientProps;
type Token = {
    accessToken: string;
    refreshToken: string;
    /** 有効期限（秒 since epoch） */
    expiresAt: number;
};
/**
 * RCDE API Client (3-legged)
 * - リフレッシュ: POST /ext/v2/oauth/token + grant_type=refresh_token
 * - 自動リフレッシュ内蔵（期限の60秒前で更新）
 * - トークン永続化は利用側（setToken/getToken で入出力）
 */
declare class RCDEClient3Legged {
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
export { RCDEClient3Legged, type ClientProps3Legged, type Token };
