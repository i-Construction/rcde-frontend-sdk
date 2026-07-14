import {
  createJsonHeaders,
  readJsonResponse,
  type RcdeClientProps,
  type RcdeToken,
} from "./rcde-auth-common";

type ConstructionResponse = {
  id?: number;
  name?: string;
};

type ContractResponse = {
  id?: number;
  name?: string;
};

export class RcdeClient2Legged {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private token?: RcdeToken;

  constructor(props: RcdeClientProps) {
    this.baseUrl = props.baseUrl.replace(/\/$/, "");
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
  }

  private get authHeaders(): Record<string, string> {
    if (this.token === undefined) {
      throw new Error("Token is not available");
    }
    return {
      ...createJsonHeaders(),
      Authorization: `Bearer ${this.token.accessToken}`,
    };
  }

  public getToken(): RcdeToken {
    if (this.token === undefined) {
      throw new Error("Token is not available");
    }
    return { ...this.token };
  }

  public async authenticate(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/ext/v2/auth/token`, {
      method: "POST",
      headers: createJsonHeaders(),
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });
    const data = await readJsonResponse<RcdeToken>(res);
    this.token = data;
  }

  public async refreshToken(): Promise<void> {
    if (this.token === undefined) {
      throw new Error("Token is not available");
    }
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/refresh`, {
      method: "POST",
      headers: {
        ...createJsonHeaders(),
        Authorization: `Bearer ${this.token.refreshToken}`,
      },
      body: JSON.stringify({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      }),
    });
    this.token = await readJsonResponse<RcdeToken>(res);
  }

  public async getConstructionList(): Promise<{ constructions: ConstructionResponse[] }> {
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/construction`, {
      headers: this.authHeaders,
    });
    return readJsonResponse<{ constructions: ConstructionResponse[] }>(res);
  }

  public async createConstruction(data: {
    name: string;
    address?: string;
    contractedAt: Date;
    period: Date;
    advancePaymentRate?: number;
    contractAmount?: number;
  }): Promise<ConstructionResponse> {
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/construction`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify({
        ...data,
        contractedAt: data.contractedAt.toISOString(),
        period: data.period.toISOString(),
      }),
    });
    return readJsonResponse<ConstructionResponse>(res);
  }

  public async getConstruction(constructionId: number): Promise<ConstructionResponse> {
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/construction/${constructionId}`, {
      headers: this.authHeaders,
    });
    return readJsonResponse<ConstructionResponse>(res);
  }

  public async getContractList(query: {
    constructionId: number;
  }): Promise<{ contracts: ContractResponse[] }> {
    const params = new URLSearchParams({
      constructionId: String(query.constructionId),
    });
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/contract?${params.toString()}`, {
      headers: this.authHeaders,
    });
    return readJsonResponse<{ contracts: ContractResponse[] }>(res);
  }

  public async createContract(data: {
    constructionId: number;
    name: string;
    contractedAt: Date;
    unitPrice?: number;
    unitVolume?: number;
  }): Promise<ContractResponse> {
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/contract`, {
      method: "POST",
      headers: this.authHeaders,
      body: JSON.stringify({
        ...data,
        contractedAt: data.contractedAt.toISOString(),
      }),
    });
    return readJsonResponse<ContractResponse>(res);
  }

  public async getContract(contractId: number): Promise<ContractResponse> {
    const res = await fetch(`${this.baseUrl}/ext/v2/authenticated/contract/${contractId}`, {
      headers: this.authHeaders,
    });
    return readJsonResponse<ContractResponse>(res);
  }
}
