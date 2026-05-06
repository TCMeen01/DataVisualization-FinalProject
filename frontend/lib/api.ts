const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} -> ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type Schema = {
  filename: string;
  columns: string[];
  dtypes: Record<string, string>;
  row_count: number;
  sample_rows: Record<string, unknown>[];
};

export type LogItem = {
  id: string;
  created_at: string;
  user_prompt: string;
  status: string;
  execution_time_ms: number | null;
};

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  schema: () => request<Schema>("/api/data/schema"),
  logs: () => request<LogItem[]>("/api/logs"),
  generate: (prompt: string) =>
    request<{ request_id: string; code: string; explanation: string; status: string }>(
      "/api/ai/generate",
      { method: "POST", body: JSON.stringify({ prompt }) },
    ),
};
