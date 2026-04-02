export type ClientProps = {
  domain?: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
};

export interface RCDEClient {
  isTokenAvailable(): void;
  refreshToken(): Promise<void>;
}
