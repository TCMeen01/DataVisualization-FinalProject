/**
 * frontend/lib/api.ts
 * Typed fetch-based API client for all backend endpoints.
 * Base URL is configured via NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 */

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

// ── Utility types ─────────────────────────────────────────────────────────────

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
  prompt: string;
  status: string;
  execution_time_ms: number | null;
  was_edited: boolean;
  has_figures: boolean;
};

// ── Data endpoint types ───────────────────────────────────────────────────────

export type KPI = {
  total_channels: number;
  total_videos: number;
  total_views: number;
  short_form_ratio: number;
};

export type OverviewMetricRow = {
  video_count: number;
  total_views: number;
  total_channels: number;
  short_form_ratio: number;
};

export type OverviewData = {
  kpis: KPI;
  /** Pie chart: category distribution — key from backend */
  a1_category_pie: ({ channel_category: string } & OverviewMetricRow)[];
  /** Line chart: total views by year — key from backend */
  a2_views_by_year: ({ channel_category: string; year: number } & OverviewMetricRow)[];
  /** Stacked area: short vs long ratio by year — key from backend */
  a3_short_long_ratio: ({ channel_category: string; year: number; short_count: number; long_count: number; short_ratio: number } & OverviewMetricRow)[];
};

export type ShortFormData = {
  /** Heatmap: channel × year → short_form_ratio */
  b1_heatmap: { channels: string[]; years: number[]; z: number[][] };
  /** Stacked bar: short vs long by year/quarter */
  b2_bar: { label: string; short: number; long: number }[];
};

export type ChannelsData = {
  /** Box plot: view/video per category */
  c1_box: { category: string; values: number[] }[];
  /** Scatter: subscriber_count vs avg_views */
  c2_scatter: {
    channel_name: string;
    subscriber_count: number;
    avg_views: number;
    video_count: number;
    category: string;
  }[];
};

export type AnomalyData = {
  /** Scatter: view_count vs like_view_ratio with suspect flag */
  d1_scatter: {
    title: string;
    channel: string;
    view_count: number;
    like_view_ratio: number;
    suspect_fake_view: boolean;
  }[];
  /** Top viral videos table */
  d2_viral: {
    rank: number;
    title: string;
    channel: string;
    view_count: number;
    is_viral: boolean;
  }[];
};

export type InteractionData = {
  /** Box: engagement_rate by duration_group × subscriber_tier */
  e1_box: { label: string; tier: string; values: number[] }[];
  /** Heatmap: day_of_week × hour_posted → avg view_count */
  e2_heatmap: { days: string[]; hours: number[]; z: number[][] };
};

export type EconomyData = {
  /** Line: commercial video count by month */
  f1_line: { month: string; count: number }[];
  /** Bar: avg view commercial vs non-commercial by category */
  f2_bar: { category: string; commercial: number; non_commercial: number }[];
  /** Top 10 commercial channels */
  top_commercial_channels: { channel_name: string; commercial_count: number }[];
};

// ── AI / Execute types ────────────────────────────────────────────────────────

export type GenerateResponse = {
  request_id: string;
  code: string;
  explanation: string;
  status: string;
};

export type ExecuteResponse = {
  request_id: string;
  status: string;
  stdout: string;
  stderr: string;
  figures: string[];          // base64 data URIs: "data:image/png;base64,..."
  execution_time_ms: number;
  error_message: string | null;
};

// ── Logs types ────────────────────────────────────────────────────────────────

export type LogListResponse = {
  total: number;
  items: LogItem[];
};

export type LogDetail = {
  id: string;
  created_at: string;
  prompt: string;
  ai_code: string;
  edited_code: string | null;
  was_edited: boolean;
  status: string;
  explanation: string | null;
  stdout: string | null;
  stderr: string | null;
  figures: string[];
  execution_time_ms: number | null;
  error_message: string | null;
};

// ── Gallery types ─────────────────────────────────────────────────────────────

export type SaveChartRequest = {
  title: string;
  figure_base64: string;
  prompt: string;
  request_id: string | null;
};

export type SavedChart = {
  id: string;
  title: string;
  figure_base64: string;
  prompt: string;
  created_at: string;
  request_id: string | null;
};

// ── Insight types ─────────────────────────────────────────────────────────────

export type InsightRequest = {
  page: string;
  filters: Record<string, unknown>;
  summary: Record<string, unknown>;
};

export type InsightResponse = {
  insight: string;
};

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
  // ── Existing (preserved unchanged) ────────────────────────────────────────
  health: () => request<{ ok: boolean }>("/health"),
  schema: () => request<Schema>("/api/data/schema"),
  generate: (prompt: string) =>
    request<GenerateResponse>("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // ── Data endpoints ─────────────────────────────────────────────────────────
  overview: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<OverviewData>(`/api/data/overview${qs}`);
  },

  shortForm: (params: { year_from?: number; year_to?: number; category?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year_from != null) qs.set("year_from", String(params.year_from));
    if (params.year_to != null)   qs.set("year_to", String(params.year_to));
    if (params.category)          qs.set("category", params.category);
    const str = qs.toString();
    return request<ShortFormData>(`/api/data/short-form${str ? `?${str}` : ""}`);
  },

  channels: (params: { category?: string; tier?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.tier)     qs.set("tier", params.tier);
    const str = qs.toString();
    return request<ChannelsData>(`/api/data/channels${str ? `?${str}` : ""}`);
  },

  anomaly: (params: { channel_id?: string; year_from?: number; year_to?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.channel_id)       qs.set("channel_id", params.channel_id);
    if (params.year_from != null) qs.set("year_from", String(params.year_from));
    if (params.year_to != null)   qs.set("year_to", String(params.year_to));
    const str = qs.toString();
    return request<AnomalyData>(`/api/data/anomaly${str ? `?${str}` : ""}`);
  },

  interaction: (params: { categories?: string; duration_group?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.categories)      qs.set("categories", params.categories);
    if (params.duration_group)  qs.set("duration_group", params.duration_group);
    const str = qs.toString();
    return request<InteractionData>(`/api/data/interaction${str ? `?${str}` : ""}`);
  },

  economy: (params: { year_from?: string; categories?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year_from)   qs.set("year_from", params.year_from);
    if (params.categories)  qs.set("categories", params.categories);
    const str = qs.toString();
    return request<EconomyData>(`/api/data/economy${str ? `?${str}` : ""}`);
  },

  // ── Execute ────────────────────────────────────────────────────────────────
  execute: (body: { request_id: string; code: string }) =>
    request<ExecuteResponse>("/api/execute", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Logs ───────────────────────────────────────────────────────────────────
  logList: (params: { status?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status)          qs.set("status", params.status);
    if (params.limit != null)   qs.set("limit", String(params.limit));
    if (params.offset != null)  qs.set("offset", String(params.offset));
    const str = qs.toString();
    return request<LogListResponse>(`/api/logs${str ? `?${str}` : ""}`);
  },

  logDetail: (id: string) => request<LogDetail>(`/api/logs/${encodeURIComponent(id)}`),

  /** @deprecated use logList() instead */
  logs: () => request<LogItem[]>("/api/logs"),

  // ── Gallery ────────────────────────────────────────────────────────────────
  saveChart: (body: SaveChartRequest) =>
    request<{ id: string; created_at: string }>("/api/gallery/save", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCharts: () => request<SavedChart[]>("/api/gallery"),

  deleteChart: (id: string) =>
    fetch(`${BASE}/api/gallery/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`API /api/gallery/${id} -> ${res.status} ${res.statusText}`);
      }
    }),

  // ── Insights ───────────────────────────────────────────────────────────────
  generateInsight: (body: InsightRequest) =>
    request<InsightResponse>("/api/insights", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
