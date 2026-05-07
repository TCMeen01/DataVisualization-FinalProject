"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { api, type SavedChart } from "@/lib/api";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export default function GalleryPage() {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedChart | null>(null);
  const [viewTarget, setViewTarget] = useState<SavedChart | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listCharts();
        if (!cancelled) setCharts(data);
      } catch (err) {
        if (!cancelled) {
          setError("Không thể tải gallery. Vui lòng kiểm tra backend.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteChart(deleteTarget.id);
      setCharts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Đã xóa chart");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Lỗi khi xóa: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-10 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">
          Gallery
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
          Chart đã lưu
        </h1>
        <p className="mt-3 max-w-2xl text-[#75758a]">
          Bộ sưu tập các chart bạn đã lưu từ AI Workspace. Click vào chart để xem
          chi tiết.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f2f2f2] border-t-[#212121]" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : charts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-[#75758a]">
              Chưa có chart nào được lưu. Tạo chart từ{" "}
              <Link
                href="/ai"
                className="font-medium text-[#1863dc] underline underline-offset-2"
              >
                AI Workspace
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {charts.map((chart) => (
            <Card
              key={chart.id}
              className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => setViewTarget(chart)}
            >
              <div className="relative bg-[#f9f9f9]">
                <img
                  src={chart.figure_base64}
                  alt={chart.title}
                  className="h-[200px] w-full object-contain"
                />
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="absolute right-2 top-2 bg-white opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(chart);
                  }}
                  aria-label="Xóa chart"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
              <CardContent className="space-y-2 pt-4">
                <h3 className="line-clamp-2 font-semibold text-[#212121]">
                  {chart.title}
                </h3>
                <p className="text-xs text-[#93939f]">
                  {formatDate(chart.created_at)}
                </p>
                <p className="text-sm text-[#75758a]">
                  {truncate(chart.prompt, 60)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa chart này?</DialogTitle>
            <DialogDescription>
              Hành động không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Hủy
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-size view dialog */}
      <Dialog
        open={viewTarget !== null}
        onOpenChange={(open) => !open && setViewTarget(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          {viewTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{viewTarget.title}</DialogTitle>
                <DialogDescription>
                  Lưu lúc {formatDate(viewTarget.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={viewTarget.figure_base64}
                  alt={viewTarget.title}
                  className="w-full rounded border"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#93939f]">
                    Prompt
                  </p>
                  <p className="mt-1 text-sm text-[#212121]">
                    {viewTarget.prompt}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
