/**
 * Skeleton loader for AI code generation
 * Shows animated placeholder with code-like structure
 */
export function SkeletonLoader() {
  return (
    <div className="space-y-3 rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-6">
      {/* Simulated code lines with varying widths */}
      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#d4d4d8]" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#d4d4d8]" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-5/6 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#d4d4d8]" />
      </div>

      <div className="space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#d4d4d8]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[#d4d4d8]" />
      </div>
    </div>
  );
}
