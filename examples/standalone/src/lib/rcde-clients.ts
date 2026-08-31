import { RcdeClient2Legged } from "./rcde-client-2-legged";

function getClientCredentials() {
  const baseUrl = process.env.RCDE_API_BASE_URL;
  const clientId = process.env.RCDE_CLIENT_ID;
  const clientSecret = process.env.RCDE_CLIENT_SECRET;
  if (baseUrl === undefined || clientId === undefined || clientSecret === undefined) {
    throw new Error("RCDE API credentials are not configured");
  }
  return { baseUrl, clientId, clientSecret };
}

export function create2LeggedClient() {
  const credentials = getClientCredentials();
  return new RcdeClient2Legged(credentials);
}
