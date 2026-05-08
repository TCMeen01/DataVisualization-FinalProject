"use client";
/**
 * InsightCard — displays an analytical insight with dynamic loading states.
 * Design: Cohere deep-green (#003c33) product band, white text.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InsightCardProps {
  title?: string;
  content?: string;
  loading?: boolean;
  error?: string;
  onGetInsight?: () => void;
}

export function InsightCard({ title, content, loading, error, onGetInsight }: InsightCardProps) {
  const [isDebouncing, setIsDebouncing] = useState(false);

  const handleClick = () => {
    if (!onGetInsight || isDebouncing || loading) return;

    // Debounce: prevent spam clicks
    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), 1000);

    onGetInsight();
  };

  // State 1: No insight - show "Get Insight" button
  if (!content && !loading && !error) {
    return (
      <div
        className="flex gap-3 p-4 rounded-[8px] items-center justify-center"
        style={{ background: "#003c33", border: "1px solid rgba(0,60,51,0.5)" }}
      >
        <Button
          onClick={handleClick}
          disabled={isDebouncing}
          className="bg-white text-[#003c33] hover:bg-gray-100 font-medium"
        >
          💡 Nhận Insight
        </Button>
      </div>
    );
  }

  // State 2: Loading
  if (loading) {
    return (
      <div
        className="flex gap-3 p-4 rounded-[8px] items-center justify-center text-white"
        style={{ background: "#003c33", border: "1px solid rgba(0,60,51,0.5)" }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <span className="text-sm">Đang tạo insight...</span>
      </div>
    );
  }

  // State 3: Error - show error message with retry button
  if (error) {
    return (
      <div
        className="flex flex-col gap-2 p-4 rounded-[8px] text-white"
        style={{ background: "#003c33", border: "1px solid rgba(0,60,51,0.5)" }}
      >
        <div className="flex gap-2 items-start">
          <span className="text-lg shrink-0">⚠️</span>
          <p className="text-sm leading-relaxed opacity-90">{error}</p>
        </div>
        <Button
          onClick={handleClick}
          disabled={isDebouncing}
          size="sm"
          className="bg-white text-[#003c33] hover:bg-gray-100 font-medium self-start"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  // State 4: Display insight
  return (
    <div
      className="flex gap-3 p-4 rounded-[8px] text-white"
      style={{ background: "#003c33", border: "1px solid rgba(0,60,51,0.5)" }}
    >
      <span className="text-lg shrink-0 mt-0.5">💡</span>
      <div className="flex flex-col gap-1">
        {title && (
          <p
            className="text-sm font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
          >
            {title}
          </p>
        )}
        <p className="text-sm leading-relaxed opacity-90">{content}</p>
      </div>
    </div>
  );
}
