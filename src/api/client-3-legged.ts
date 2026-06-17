import { Api as Api3Legged } from "./api-3-legged";
import { ClientProps } from "./common";
import { Chunkable, chunkedUpload, getTotalSize } from "./chunk-uploader";

type Api = Api3Legged<unknown>;

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
class RCDEClient3Legged {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private api: Api;
  private origin: string;
  private token?: Token;

  constructor(props: ClientProps3Legged) {
    const { baseUrl, clientId, clientSecret, domain } = props;
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.origin = domain ?? "";
    this.api = new Api3Legged({ baseUrl });
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.origin) h["Origin"] = this.origin;
    return h;
  }

  public setToken(token: Token) {
    this.token = token;
  }

  public getToken(): Token {
    this.isTokenAvailable();
    return { ...(this.token as Token) };
  }

  public async authenticate(authCode: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/ext/v2/oauth/token`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: "authorization_code",
        authCode,
      }),
    });
    const data = await res.json();
    const { accessToken, refreshToken, expiresAt } = data ?? {};
    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("Invalid token response for authorization_code");
    }
    this.token = { accessToken, refreshToken, expiresAt };
  }

  private needsRefresh(skewSec = 60): boolean {
    if (!this.token?.expiresAt) return false;
    const now = Math.floor(Date.now() / 1000);
    return this.token.expiresAt - now <= skewSec;
  }

  public async refreshToken(): Promise<void> {
    this.isTokenAvailable();
    if (!this.token!.refreshToken) throw new Error("No refresh token");

    const res = await fetch(`${this.baseUrl}/ext/v2/oauth/token`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        grantType: "refresh_token",
        refreshToken: this.token!.refreshToken,
      }),
    });
    const data = await res.json();
    const { accessToken, refreshToken, expiresAt } = data ?? {};
    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("Invalid token response for refresh_token");
    }
    this.token = { accessToken, refreshToken, expiresAt };
  }

  private async ensureValidAccessToken(): Promise<string> {
    if (this.needsRefresh()) await this.refreshToken();
    if (!this.token?.accessToken) throw new Error("No access token");
    return this.token.accessToken;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const at = await this.ensureValidAccessToken();
    return { ...this.headers, Authorization: `Bearer ${at}` };
  }

  private isTokenAvailable() {
    if (!this.token) throw new Error("Token is not available");
  }

  public async getContractFileProcessingStatus(contractFileId: number) {
    this.isTokenAvailable();
    const headers = await this.getAuthHeaders();
    const res = await this.api.ext.getExt3LeggedV2AuthenticatedContractFileProcessingStatus(
      contractFileId,
      { headers }
    );
    return res.data;
  }

  public async uploadContractFileMultipart(params: {
    contractId: number;
    file: Chunkable | File;
    filename: string;
    chunkSize?: number;
    onProgress?: (uploaded: number, total: number | null) => void;
  }) {
    this.isTokenAvailable();
    const headers = await this.getAuthHeaders();

    const chunkSize = params.chunkSize ?? 5 * 1024 * 1024;
    const totalSize = await getTotalSize(params.file as Chunkable);
    const partTotal = totalSize ? Math.ceil(totalSize / chunkSize) : 1;

    const init = await this.api.ext.postExt3LeggedV2AuthenticatedContractFilePointCloudMultipartUpload(
      {
        contractId: params.contractId,
        name: params.filename,
        size: totalSize ?? 0,
        partTotal,
      },
      { headers }
    );

    const { s3UploadId, presignedUploadParts, blockChainUploadId, contractFileId } = init.data;
    const s3Parts: { partNumber?: number; etag?: string }[] = [];
    let partIndex = 0;

    await chunkedUpload(params.file as Chunkable, {
      chunkSize,
      upload: async (chunk, _part, _offset, _total) => {
        const presignedPart = presignedUploadParts?.[partIndex];
        const url = presignedPart?.presignedURL;
        if (!url) {
          throw new Error(`パート ${partIndex} の presignedURL が取得できませんでした`);
        }
        const res = await fetch(url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": "application/octet-stream" },
        });
        const etag = res.headers.get("etag") ?? "";
        s3Parts.push({
          partNumber: presignedPart.partNumber ?? partIndex + 1,
          etag,
        });
        partIndex++;
      },
      onProgress: params.onProgress,
    });

    if (!contractFileId || !s3UploadId || !blockChainUploadId) {
      throw new Error("マルチパートアップロードの完了に必要な情報が不足しています");
    }

    const done = await this.api.ext.putExt3LeggedV2AuthenticatedContractFilePointCloudCompleteMultipartUpload(
      {
        contractFileId,
        s3UploadId,
        s3Parts,
        blockChainUploadId,
      },
      { headers }
    );

    return done.data;
  }
}

export { RCDEClient3Legged, type ClientProps3Legged, type Token };
