import Link from "next/link";
import { BarChart3, Bot, ScrollText } from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/ai", label: "AI Workspace", icon: Bot },
  { href: "/logs", label: "Logs", icon: ScrollText },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white px-3 py-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-8 px-3">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">vn-dataviz-ai</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Data Viz + AI
        </h2>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
