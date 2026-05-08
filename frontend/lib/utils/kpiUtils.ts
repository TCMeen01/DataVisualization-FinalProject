/**
 * KPI calculation utilities for Overview dashboard
 * Calculates metrics from filtered data
 */

import { KPI } from "@/lib/api";

export interface KPICalculationData {
  channel_id?: string;
  video_count?: number;
  total_videos?: number;
  total_views?: number;
  total_channels?: number;
  short_form_ratio?: number;
  is_short_form?: boolean;
  [key: string]: unknown;
}

/**
 * Calculate KPIs from filtered data
 * Returns metrics matching the KPI type from api.ts
 */
export function calculateKPIs(data: KPICalculationData[]): KPI {
  const total_videos = data.reduce(
    (sum, item) => sum + (item.total_videos ?? item.video_count ?? 0),
    0
  );
  const total_views = data.reduce((sum, item) => sum + (item.total_views || 0), 0);
  const total_channels = data.some((item) => typeof item.total_channels === "number")
    ? data.reduce((max, item) => Math.max(max, item.total_channels || 0), 0)
    : new Set(data.map((item) => item.channel_id).filter(Boolean)).size;
  const weightedShorts = data.reduce(
    (sum, item) => sum + (item.short_form_ratio ?? (item.is_short_form ? 1 : 0)) * (item.total_videos ?? item.video_count ?? 1),
    0
  );
  const denominator = data.reduce((sum, item) => sum + (item.total_videos ?? item.video_count ?? 1), 0);

  return {
    total_channels,
    total_videos,
    total_views,
    short_form_ratio: denominator > 0 ? weightedShorts / denominator : 0,
  };
}
