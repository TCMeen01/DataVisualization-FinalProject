"use client";
/**
 * Sidebar — 8-item navigation for Hanoi AQI Dashboard
 * Routes: / (overview) + 5 RO pages + /ai + /logs
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cloud,
  Clock,
  Wind,
  TrendingUp,
  Calendar,
  Sparkles,
  ScrollText,
} from "lucide-react";

const items = [
  { href: "/",            label: "Tổng Quan",               icon: LayoutDashboard },
  { href: "/seasonal",    label: "Ô Nhiễm Theo Mùa",       icon: Cloud },
  { href: "/hourly",      label: "Nguy Hiểm Theo Giờ",     icon: Clock },
  { href: "/weather",     label: "Tác Động Thời Tiết",     icon: Wind },
  { href: "/trend",       label: "Xu Hướng Năm Qua Năm",   icon: TrendingUp },
  { href: "/weekend",     label: "Cuối Tuần vs Ngày Thường", icon: Calendar },
  { href: "/ai",          label: "AI Workspace",            icon: Sparkles },
  { href: "/logs",        label: "Audit Logs",              icon: ScrollText },
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
          Hà Nội • PM2.5
        </p>
        <h2
          className="mt-1 text-lg font-semibold text-white leading-tight"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          Air Quality
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
                background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                borderLeft: isActive ? "2px solid #10b981" : "2px solid transparent",
                fontFamily: "var(--font-sans, Inter, Arial, sans-serif)",
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "#10b981" : "#75758a" }}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 px-3 border-t border-gray-700">
        <p className="text-[11px]" style={{ color: "#75758a" }}>
          Dataset: 2024–2026
        </p>
        <p className="text-[11px] mt-1" style={{ color: "#75758a" }}>
          ~14,451 giờ đo
        </p>
      </div>
    </aside>
  );
}
