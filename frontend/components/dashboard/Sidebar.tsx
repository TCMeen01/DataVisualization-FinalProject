"use client";
/**
 * Sidebar — 8-item navigation following Cohere near-black (#17171c) product band.
 * Active route: action-blue left border + subtle highlight.
 * No slide animation — always visible.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  AlertTriangle,
  Heart,
  ShoppingCart,
  Sparkles,
  ScrollText,
  Images,
} from "lucide-react";

const items = [
  { href: "/",            label: "Tổng Quan",             icon: LayoutDashboard },
  { href: "/short-form",  label: "Xu Hướng Short-form",   icon: TrendingUp },
  { href: "/channels",    label: "Tăng Trưởng Kênh",      icon: Users },
  { href: "/anomaly",     label: "Bất Thường & Viral",     icon: AlertTriangle },
  { href: "/interaction", label: "Nghịch Lý Tương Tác",   icon: Heart },
  { href: "/economy",     label: "Creator Economy",        icon: ShoppingCart },
  { href: "/ai",          label: "AI Workspace",           icon: Sparkles },
  { href: "/gallery",     label: "Gallery",                icon: Images },
  { href: "/logs",        label: "Audit Log",              icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-64 shrink-0 flex-col px-3 py-6"
      style={{ background: "#17171c", borderRight: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* Brand */}
      <div className="mb-8 px-3">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: "#93939f", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.28px" }}
        >
          VN • YouTube
        </p>
        <h2
          className="mt-1 text-lg font-semibold text-white leading-tight"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          Analytics + AI
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors duration-150"
              style={{
                color: isActive ? "#ffffff" : "#93939f",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                borderLeft: isActive ? "2px solid #1863dc" : "2px solid transparent",
                fontFamily: "var(--font-sans, Inter, Arial, sans-serif)",
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "#1863dc" : "#75758a" }}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 px-3">
        <p className="text-[11px]" style={{ color: "#75758a" }}>
          Đồ án Trực quan hóa Dữ liệu
        </p>
      </div>
    </aside>
  );
}
