/**
 * ブラウザ（クライアントコンポーネント）から `/api/constructions` を呼ぶ唯一の経路。
 *
 * 取得失敗は空配列へ潰さず Error として投げる。呼び出し側は
 * `describeConstructionsApiError` でそのまま画面に出せるメッセージを取り出す。
 *
 * server-only なモジュール（rcde-server 等）と同じ barrel に載せないため、
 * このファイルは単体で import する。
 */

const CONSTRUCTIONS_ENDPOINT = "/api/constructions";

const CONSTRUCTION_LIST_ERROR_MESSAGE = "現場一覧の取得に失敗しました";
const CONTRACT_LIST_ERROR_MESSAGE = "契約一覧の取得に失敗しました";
const UNKNOWN_ERROR_MESSAGE = "データの取得に失敗しました";

export type Construction = {
  id: number;
  name: string;
};

export type Contract = {
  id: number;
  name: string;
};

type ConstructionListResponse = {
  constructions?: Construction[];
};

type ContractListResponse = {
  contracts?: Contract[];
};

/**
 * エラー応答の本文から `{ error: string }` を取り出す。
 * 本文が JSON でない場合（プロキシの HTML エラーページ等）は既定文言へ落とす。
 */
async function readErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      const message = (body as { error?: unknown }).error;
      if (typeof message === "string" && message.length > 0) {
        return message;
      }
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * `res.ok` を `res.json()` より先に見る。
 * 非 JSON のエラー応答でも json パースの例外ではなく、意味のある Error を投げる。
 */
async function requestConstructionsApi<T>(
  path: string,
  accessToken: string,
  fallbackMessage: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, fallbackMessage));
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

export async function fetchConstructions(accessToken: string): Promise<Construction[]> {
  const constructionListResponse = await requestConstructionsApi<ConstructionListResponse>(
    CONSTRUCTIONS_ENDPOINT,
    accessToken,
    CONSTRUCTION_LIST_ERROR_MESSAGE
  );
  return constructionListResponse.constructions ?? [];
}

export async function fetchContracts(
  accessToken: string,
  constructionId: number
): Promise<Contract[]> {
  const contractListResponse = await requestConstructionsApi<ContractListResponse>(
    `${CONSTRUCTIONS_ENDPOINT}?constructionId=${constructionId}`,
    accessToken,
    CONTRACT_LIST_ERROR_MESSAGE
  );
  return contractListResponse.contracts ?? [];
}

/**
 * catch した値を画面表示用の文言へ変換する。
 * 本モジュールが投げるのは常に Error なので、通常はそのメッセージが返る。
 */
export function describeConstructionsApiError(error: unknown): string {
  return error instanceof Error && error.message.length > 0 ? error.message : UNKNOWN_ERROR_MESSAGE;
}
