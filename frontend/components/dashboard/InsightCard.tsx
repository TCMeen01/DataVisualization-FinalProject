/**
 * InsightCard — displays an analytical insight.
 * Design: Cohere deep-green (#003c33) product band, white text.
 */
interface InsightCardProps {
  title?: string;
  content: string;
}

export function InsightCard({ title, content }: InsightCardProps) {
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
