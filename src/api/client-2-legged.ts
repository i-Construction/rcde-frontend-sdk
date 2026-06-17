import { Api } from "./api-2-legged";
import { ClientProps } from "./common";

/**
 * RCDE API Client for 2-legged authentication
 */
class RCDEClient2Legged {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private api: Api<unknown>;
  private origin: string;
  private token?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };

  constructor(props: ClientProps) {
    const { domain, baseUrl, clientId, clientSecret } = props;
    this.baseUrl = baseUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.origin = domain ?? "";
    this.api = new Api({ baseUrl: this.baseUrl });
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.origin) h["Origin"] = this.origin;
    return h;
  }

  private get authHeaders(): Record<string, string> {
    return { ...this.headers, Authorization: `Bearer ${this.accessToken}` };
  }

  private get accessToken(): string {
    if (!this.token?.accessToken) throw new Error("Token is not available");
    return this.token.accessToken;
  }

  private isTokenAvailable() {
    if (!this.token) throw new Error("Token is not available");
  }

  /**
   * 現在保持しているトークンのコピーを返す。
   * 未認証時は throw する（private フィールドを外部から覗かせないための公開 API）。
   */
  public getToken(): { accessToken: string; refreshToken: string; expiresAt: number } {
    if (!this.token?.accessToken) throw new Error("Token is not available");
    return {
      accessToken: this.token.accessToken,
      refreshToken: this.token.refreshToken ?? "",
      expiresAt: this.token.expiresAt ?? 0,
    };
  }

  public async authenticate() {
    const res = await this.api.ext.postExtV2AuthToken(
      { clientId: this.clientId, clientSecret: this.clientSecret },
      { headers: this.headers }
    );
    this.token = res.data;
  }

  public async refreshToken(): Promise<void> {
    this.isTokenAvailable();
    if (!this.token!.refreshToken) throw new Error("No refresh token");

    const res = await this.api.ext.postExtV2AuthenticatedRefresh(
      { clientId: this.clientId, clientSecret: this.clientSecret },
      { headers: { ...this.headers, Authorization: `Bearer ${this.token!.refreshToken}` } }
    );
    const { accessToken, refreshToken, expiresAt } = res.data ?? {};
    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("Invalid token response for 2-legged refresh");
    }
    this.token = { accessToken, refreshToken, expiresAt };
  }

  public async createEquipmentToken(
    data: Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedEquipmentToken"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.postExtV2AuthenticatedEquipmentToken(data, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async getConstructionList() {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedConstructionList({
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async createConstruction(
    data: Omit<
      Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedConstruction"]>[0],
      "period" | "contractedAt"
    > & { period: Date; contractedAt: Date }
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.postExtV2AuthenticatedConstruction(
      { ...data, period: data.period.toISOString(), contractedAt: data.contractedAt.toISOString() },
      { headers: this.authHeaders }
    );
    return res.data;
  }

  public async getConstruction(
    constructionId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedConstruction"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedConstruction(constructionId, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async updateConstruction(
    constructionId: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedConstruction"]>[0],
    data: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedConstruction"]>[1]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.putExtV2AuthenticatedConstruction(constructionId, data, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async deleteConstruction(
    constructionId: Parameters<Api<unknown>["ext"]["deleteExtV2AuthenticatedConstruction"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.deleteExtV2AuthenticatedConstruction(constructionId, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async getContractList(
    query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractList"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedContractList(query, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async createContract(
    data: Omit<
      Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedContract"]>[0],
      "contractedAt"
    > & { contractedAt: Date }
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.postExtV2AuthenticatedContract(
      { ...data, contractedAt: data.contractedAt.toISOString() },
      { headers: this.authHeaders }
    );
    return res.data;
  }

  public async getContract(
    contractId: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContract"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedContract(contractId, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async updateContract(
    contractId: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContract"]>[0],
    data: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContract"]>[1]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.putExtV2AuthenticatedContract(contractId, data, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async deleteContract(
    contractId: Parameters<Api<unknown>["ext"]["deleteExtV2AuthenticatedContract"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.deleteExtV2AuthenticatedContract(contractId, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async getContractFileList(
    query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedContractFileList"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedContractFileList(query, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async getContractFileMetadata(
    query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodMeta"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedPclodMeta(query, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  public async getContractFileImagePosition(
    query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImagePosition"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedPclodImagePosition(query, {
      headers: this.authHeaders,
      format: "arrayBuffer",
    });
    return res.data;
  }

  public async getContractFileImageColor(
    query: Parameters<Api<unknown>["ext"]["getExtV2AuthenticatedPclodImageColor"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedPclodImageColor(query, {
      headers: this.authHeaders,
      format: "arrayBuffer",
    });
    return res.data;
  }

  private async createContractFileUploadUrl(
    data: Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedContractFilePointCloud"]>[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.postExtV2AuthenticatedContractFilePointCloud(data, {
      headers: this.authHeaders,
    });
    return res.data;
  }

  private async completeContractFileUpload(
    contractFileId: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContractFileUploaded"]>[0],
    data: Parameters<Api<unknown>["ext"]["putExtV2AuthenticatedContractFileUploaded"]>[1]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.putExtV2AuthenticatedContractFileUploaded(
      contractFileId,
      data,
      { headers: this.authHeaders }
    );
    return res.data;
  }

  public async uploadContractFile(
    data: Omit<
      Parameters<Api<unknown>["ext"]["postExtV2AuthenticatedContractFilePointCloud"]>[0],
      "size"
    > & { buffer: ArrayBuffer | Blob; size?: number }
  ) {
    const { buffer, size: _size, ...rest } = data;

    let size = _size ?? 0;
    if (buffer instanceof ArrayBuffer) size = buffer.byteLength;
    if (buffer instanceof Blob) size = buffer.size;
    if (size === 0) throw new Error("size field is required");

    const uploadUrlRes = await this.createContractFileUploadUrl({ ...rest, size });
    const presignedURL = uploadUrlRes.presignedURL;
    const contractFileId = uploadUrlRes.contractFileId;

    if (!presignedURL) throw new Error("presignedURL が取得できませんでした");
    if (contractFileId === undefined) throw new Error("contractFileId が取得できませんでした");

    await fetch(presignedURL, {
      method: "PUT",
      body: buffer,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": size.toString(),
      },
    });

    return await this.completeContractFileUpload(contractFileId, {
      contractId: rest.contractId,
    });
  }

  public async getContractFileDownloadUrl(
    contractId: Parameters<
      Api<unknown>["ext"]["getExtV2AuthenticatedContractFileDownloadUrl"]
    >[1]["contractId"],
    contractFileId: Parameters<
      Api<unknown>["ext"]["getExtV2AuthenticatedContractFileDownloadUrl"]
    >[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedContractFileDownloadUrl(
      contractFileId,
      { contractId },
      { headers: this.authHeaders }
    );
    return res.data;
  }

  public async getContractFileProcessingStatus(
    contractId: Parameters<
      Api<unknown>["ext"]["getExtV2AuthenticatedContractFileProcessingStatus"]
    >[1]["contractId"],
    contractFileId: Parameters<
      Api<unknown>["ext"]["getExtV2AuthenticatedContractFileProcessingStatus"]
    >[0]
  ) {
    this.isTokenAvailable();
    const res = await this.api.ext.getExtV2AuthenticatedContractFileProcessingStatus(
      contractFileId,
      { contractId },
      { headers: this.authHeaders }
    );
    return res.data;
  }
}

export { RCDEClient2Legged };
