import { redirect } from "next/navigation";
import { getStoredToken } from "@/lib/auth-store";
import { isExpiringSoon } from "@/lib/rcde-auth-common";
import { LoginError } from "./LoginError";

type SearchParams = {
  error?: string;
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  if (params.error) {
    return <LoginError message={params.error} />;
  }

  const token = await getStoredToken();
  const nowSec = Math.floor(Date.now() / 1000);
  if (token && !isExpiringSoon(token.expiresAt, nowSec)) {
    redirect("/viewer");
  }

  redirect("/api/auth/login");
}
