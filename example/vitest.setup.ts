import { vi } from "vitest";

// next/headers 依存の server-only モジュールを Vitest で読み込めるようにする
vi.mock("server-only", () => ({}));
