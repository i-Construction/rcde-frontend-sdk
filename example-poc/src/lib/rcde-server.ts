import { RCDEClient2Legged, RCDEClient3Legged } from "@i-con/frontend-sdk/api-server";

export function getAuthType(): "2legged" | "3legged" {
  const authType = process.env.AUTH_TYPE ?? "2legged";
  if (authType === "3legged") {
    return "3legged";
  }
  return "2legged";
}

export function create2LeggedClient() {
  return new RCDEClient2Legged({
    baseUrl: process.env.RCDE_API_BASE_URL!,
    clientId: process.env.RCDE_CLIENT_ID!,
    clientSecret: process.env.RCDE_CLIENT_SECRET!,
  });
}

export function create3LeggedClient() {
  return new RCDEClient3Legged({
    baseUrl: process.env.RCDE_API_BASE_URL!,
    clientId: process.env.RCDE_CLIENT_ID!,
    clientSecret: process.env.RCDE_CLIENT_SECRET!,
    authCode: "",
  });
}
