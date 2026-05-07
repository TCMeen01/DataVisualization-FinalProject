/**
 * ChartCard — universal wrapper for all dashboard charts.
 * Handles loading skeleton, error state, title, and description.
 * Design: Cohere canvas-first white card with hairline border.
 */
import React from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  loading,
  error,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`bg-white border border-[#f2f2f2] rounded-[8px] p-6 flex flex-col gap-4 ${className}`}
    >
      {/* Header */}
      <div>
        <h3
          className="text-base font-semibold text-[#212121] leading-tight"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-[#93939f]">{description}</p>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 bg-[#f2f2f2] rounded w-3/4" />
          <div className="h-40 bg-[#f2f2f2] rounded" />
          <div className="h-4 bg-[#f2f2f2] rounded w-1/2" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40 text-sm text-[#b30000] bg-red-50 rounded">
          <span>⚠ {error}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
