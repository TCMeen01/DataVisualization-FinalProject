/**
 * Progress indicator for AI code generation
 * Shows spinner and status text based on generation phase
 */
export interface GenerationProgressProps {
  phase: "connecting" | "streaming" | "complete";
}

export function GenerationProgress({ phase }: GenerationProgressProps) {
  const statusText = {
    connecting: "Đang kết nối với AI...",
    streaming: "Đang sinh code...",
    complete: "Hoàn thành!",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] px-4 py-3">
      {phase !== "complete" && (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d4d4d8] border-t-[#212121]" />
      )}
      {phase === "complete" && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
      <span className="text-sm font-medium text-[#212121]">
        {statusText[phase]}
      </span>
    </div>
  );
}
