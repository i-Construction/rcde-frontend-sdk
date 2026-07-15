import "server-only";
import { storeToken } from "./auth-store";
import { create2LeggedClient } from "./rcde-clients";

export async function authenticate2Legged(): Promise<void> {
  const client = create2LeggedClient();
  await client.authenticate();
  await storeToken(client.getToken());
}
