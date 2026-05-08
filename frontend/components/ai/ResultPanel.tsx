"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

type ResultStatus = "completed" | "failed" | "executing" | "idle";

interface ResultPanelProps {
  figures: string[];
  stdout: string;
  execution_time_ms: number | null;
  error_message: string | null;
  request_id?: string | null;
  prompt?: string;
  status?: ResultStatus;
}

export function ResultPanel({
  figures,
  stdout,
  execution_time_ms,
  error_message,
  request_id = null,
  prompt = "",
  status = "idle",
}: ResultPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const hasContent =
    figures.length > 0 || stdout || execution_time_ms !== null || error_message;

  const canSave = figures.length > 0 && status === "completed";

  const openSaveDialog = () => {
    setTitle(prompt.slice(0, 50));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (figures.length === 0) return;
    setSaving(true);
    try {
      // Lưu tất cả charts
      const baseTitle = title.trim() || prompt.slice(0, 50);
      const savePromises = figures.map((figure, index) => {
        const chartTitle = figures.length > 1
          ? `${baseTitle} (${index + 1}/${figures.length})`
          : baseTitle;
        return api.saveChart({
          title: chartTitle,
          figure_base64: figure,
          prompt,
          request_id,
        });
      });

      await Promise.all(savePromises);

      const message = figures.length > 1
        ? `Đã lưu ${figures.length} biểu đồ vào bộ sưu tập!`
        : "Đã lưu biểu đồ vào bộ sưu tập!";
      toast.success(message);
      setDialogOpen(false);
    } catch (error) {
      toast.error("Lỗi khi lưu biểu đồ: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!hasContent) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-32 items-center justify-center text-zinc-500">
          Chưa có kết quả. Nhấn Duyệt để chạy mã.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error_message && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Lỗi thực thi:
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-600 dark:text-red-300">
              {error_message}
            </pre>
          </CardContent>
        </Card>
      )}

      {figures.length > 0 && (
        <div className="space-y-3">
          {figures.map((src, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <img
                  src={src}
                  alt={`Hình ${i + 1}`}
                  className="w-full rounded"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canSave && (
        <div className="flex justify-end">
          <Button onClick={openSaveDialog} variant="outline">
            <Save className="mr-2 h-4 w-4" />
            Lưu vào bộ sưu tập
          </Button>
        </div>
      )}

      {stdout && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Kết quả đầu ra
            </p>
            <pre className="max-h-64 overflow-auto rounded bg-zinc-900 p-3 font-mono text-xs leading-relaxed text-zinc-100">
              {stdout}
            </pre>
          </CardContent>
        </Card>
      )}

      {execution_time_ms !== null && (
        <p className="text-xs text-zinc-500">
          Thực thi trong {execution_time_ms}ms
        </p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lưu biểu đồ vào bộ sưu tập</DialogTitle>
            <DialogDescription>
              {figures.length > 1
                ? `Sẽ lưu ${figures.length} biểu đồ. Đặt tên chung cho các biểu đồ (hệ thống sẽ tự thêm số thứ tự).`
                : "Đặt tên cho biểu đồ để dễ tìm lại. Nếu bỏ trống, hệ thống sẽ tự sinh từ yêu cầu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="chart-title">
              Tên biểu đồ (tùy chọn)
            </label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tương tác theo danh mục"
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={saving} />}>
              Hủy
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : `Lưu${figures.length > 1 ? ` ${figures.length} biểu đồ` : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
