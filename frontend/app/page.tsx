import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, type Schema } from "@/lib/api";

async function loadSchema(): Promise<Schema | null> {
  try {
    return await api.schema();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const schema = await loadSchema();

  return (
    <div className="px-10 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Dashboard</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Vietnam Data Visualization
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Trang chính hiển thị các chart tương tác. Giai đoạn init: chỉ load schema từ
          backend để xác nhận kết nối.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dataset schema</CardTitle>
          {schema ? (
            <Badge variant="secondary">{schema.row_count} rows</Badge>
          ) : (
            <Badge variant="destructive">Backend offline</Badge>
          )}
        </CardHeader>
        <CardContent>
          {schema ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                File: <code className="font-mono">{schema.filename}</code>
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {schema.columns.map((col) => (
                  <div
                    key={col}
                    className="rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                  >
                    <div className="font-medium">{col}</div>
                    <div className="text-xs text-zinc-500">{schema.dtypes[col]}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Không thể kết nối tới backend. Hãy chạy{" "}
              <code className="font-mono">uvicorn app.main:app --reload</code> ở thư mục{" "}
              <code className="font-mono">backend/</code>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
