"use client";

import { Badge } from "@/components/ui/badge";

export type RequestStatus =
  | "idle"
  | "generating"
  | "pending"
  | "edited"
  | "executing"
  | "completed"
  | "failed"
  | "rejected";

interface StatusBadgeProps {
  status: RequestStatus;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Chưa bắt đầu",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  generating: {
    label: "Đang sinh...",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse",
  },
  pending: {
    label: "Chờ duyệt",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
  edited: {
    label: "Đã chỉnh sửa",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  executing: {
    label: "Đang chạy",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 animate-pulse",
  },
  completed: {
    label: "Hoàn tất",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  failed: {
    label: "Thất bại",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 line-through",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
