import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AIWorkspacePage() {
  return (
    <div className="px-10 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">AI Workspace</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Phân tích bằng natural language
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Human-in-the-loop: AI sinh code, bạn review/edit/approve, backend chạy local.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="VD: Vẽ phân bố giá nhà theo quận ở TP.HCM"
              className="min-h-[120px]"
            />
            <Button>Sinh code</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>2. Code AI sinh ra</CardTitle>
            <Badge variant="outline">pending</Badge>
          </CardHeader>
          <CardContent>
            <pre className="rounded bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-100">
              {`# Code sẽ hiển thị ở đây sau khi nhấn "Sinh code".\n# Bạn có thể edit trước khi Approve.`}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button variant="default">Approve & Run</Button>
              <Button variant="outline">Edit</Button>
              <Button variant="ghost">Reject</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
