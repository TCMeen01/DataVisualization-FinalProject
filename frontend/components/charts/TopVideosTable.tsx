/**
 * TopVideosTable — table with inline mini-bar for Chart D2 (top viral videos).
 * Design: hairline-bordered rows, rank column, viral badge, Cohere typography.
 */
import { formatNumber } from "@/lib/constants";

interface VideoRow {
  rank?: number;
  title: string;
  channel: string;
  view_count: number;
  is_viral?: boolean;
}

interface TopVideosTableProps {
  data: VideoRow[];
}

export function TopVideosTable({ data }: TopVideosTableProps) {
  const maxViews = Math.max(...data.map((r) => r.view_count), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#d9d9dd]">
            <th className="text-left py-2 px-3 text-[#93939f] font-medium w-8">#</th>
            <th className="text-left py-2 px-3 text-[#93939f] font-medium">Title</th>
            <th className="text-left py-2 px-3 text-[#93939f] font-medium hidden md:table-cell">Channel</th>
            <th className="text-right py-2 px-3 text-[#93939f] font-medium">Views</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#f2f2f2] hover:bg-[#eeece7]/50 transition-colors"
            >
              <td className="py-2 px-3 text-[#93939f] tabular-nums">{row.rank ?? i + 1}</td>
              <td className="py-2 px-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[#212121] truncate max-w-[220px]" title={row.title}>
                    {row.title.length > 40 ? `${row.title.slice(0, 40)}…` : row.title}
                  </span>
                  {/* Mini horizontal bar */}
                  <div className="h-1.5 bg-[#f2f2f2] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.view_count / maxViews) * 100}%`,
                        background: row.is_viral ? "#ff7759" : "#1863dc",
                      }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-2 px-3 text-[#75758a] hidden md:table-cell truncate max-w-[120px]">
                {row.channel}
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-[#212121]">
                <div className="flex flex-col items-end gap-1">
                  <span>{formatNumber(row.view_count)}</span>
                  {row.is_viral && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-[#ff7759]/10 text-[#ff7759] rounded-full">
                      Viral
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
