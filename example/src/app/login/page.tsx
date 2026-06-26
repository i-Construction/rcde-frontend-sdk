import { redirect } from "next/navigation";
import { getStoredToken } from "@/lib/auth-store";
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
  if (token) {
    redirect("/viewer");
  }

  redirect("/api/auth/login");
}
