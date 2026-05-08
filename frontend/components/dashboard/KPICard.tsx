/**
 * KPICard — displays a single key performance indicator.
 * Design: Cohere canvas-white card, Space Grotesk large value.
 */
interface KPICardProps {
  label: string;
  value: string | number;
  subText?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function KPICard({ label, value, subText, icon, loading }: KPICardProps) {
  return (
    <div className="bg-white border border-[#f2f2f2] rounded-[8px] p-6 flex flex-col gap-2">
      {icon && <div className="text-[#93939f]">{icon}</div>}
      <p
        className={`text-3xl font-semibold text-[#212121] leading-none tabular-nums transition-opacity duration-300 ${
          loading ? "animate-pulse opacity-50" : ""
        }`}
        style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
      >
        {value}
      </p>
      <p className="text-sm text-[#93939f]">{label}</p>
      {subText && (
        <p className="text-xs text-[#75758a]">{subText}</p>
      )}
    </div>
  );
}
