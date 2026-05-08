"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ai/ChatInput";
import { CodeBlock } from "@/components/ai/CodeBlock";
import { StatusBadge, type RequestStatus } from "@/components/ai/StatusBadge";
import { ResultPanel } from "@/components/ai/ResultPanel";
import { SkeletonLoader } from "@/components/ai/SkeletonLoader";
import { GenerationProgress } from "@/components/ai/GenerationProgress";
import { useStreamingResponse } from "@/lib/hooks/useStreamingResponse";
import { api } from "@/lib/api";
import { toast } from "sonner";

type RequestState = {
  id: string;
  ai_code: string;
  edited_code: string | null;
  explanation: string;
  status: RequestStatus;
};

type ResultState = {
  figures: string[];
  stdout: string;
  execution_time_ms: number | null;
  error_message: string | null;
  prompt: string;
};

export default function AIWorkspacePage() {
  const [request, setRequest] = useState<RequestState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");

  // Feature flag for streaming (default: true)
  const enableStreaming =
    process.env.NEXT_PUBLIC_ENABLE_STREAMING !== "false";

  // Use streaming hook
  const streaming = useStreamingResponse({
    enableStreaming,
    onComplete: (requestId) => {
      if (requestId) {
        setRequest((prev) =>
          prev
            ? { ...prev, id: requestId, status: "pending" }
            : {
                id: requestId,
                ai_code: streaming.code,
                edited_code: null,
                explanation: streaming.explanation,
                status: "pending",
              }
        );
      }
      toast.success("Code đã được sinh!");
    },
    onError: (error) => {
      toast.error("Lỗi khi sinh code: " + error);
      setRequest(null);
    },
  });

  const handleSubmit = async (prompt: string) => {
    setRequest(null);
    setResult(null);
    setLastPrompt(prompt);

    // Start streaming
    await streaming.startStreaming(prompt);
  };

  const handleCodeChange = (newCode: string) => {
    if (!request) return;

    if (newCode !== request.ai_code) {
      setRequest({
        ...request,
        edited_code: newCode,
        status: "edited",
      });
    } else {
      setRequest({
        ...request,
        edited_code: null,
        status: "pending",
      });
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    try {
      setRequest({ ...request, status: "executing" });
      toast.info("Đang thực thi code...");

      const codeToExecute = request.edited_code ?? request.ai_code;
      const response = await api.execute({
        request_id: request.id,
        code: codeToExecute,
      });

      const finalStatus: RequestStatus =
        response.status === "completed" ? "completed" : "failed";

      setRequest({ ...request, status: finalStatus });
      setResult({
        figures: response.figures || [],
        stdout: response.stdout || "",
        execution_time_ms: response.execution_time_ms,
        error_message: response.error_message,
        prompt: lastPrompt,
      });

      if (finalStatus === "completed") {
        toast.success("Thực thi thành công!");
      } else {
        toast.error("Thực thi thất bại");
      }
    } catch (error) {
      setRequest({ ...request, status: "failed" });
      toast.error("Lỗi khi thực thi: " + (error as Error).message);
    }
  };

  const handleReject = () => {
    if (!request) return;

    setRequest({ ...request, status: "rejected" });
    toast.info("Đã từ chối request");

    setTimeout(() => {
      setRequest(null);
      setResult(null);
    }, 1500);
  };

  const isLoading = streaming.isStreaming;
  const showActions =
    request && (request.status === "pending" || request.status === "edited");

  // Determine generation phase for progress indicator
  const generationPhase = streaming.isStreaming
    ? streaming.code
      ? "streaming"
      : "connecting"
    : "complete";

  // Show skeleton when waiting for first chunk
  const showSkeleton = streaming.isStreaming && !streaming.code;

  // Update request state as streaming progresses
  if (streaming.isStreaming && streaming.code && !request) {
    setRequest({
      id: streaming.requestId || "",
      ai_code: streaming.code,
      edited_code: null,
      explanation: streaming.explanation,
      status: "generating",
    });
  } else if (streaming.isStreaming && streaming.code && request) {
    if (
      request.ai_code !== streaming.code ||
      request.explanation !== streaming.explanation
    ) {
      setRequest({
        ...request,
        ai_code: streaming.code,
        explanation: streaming.explanation,
      });
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white px-10 py-8 dark:bg-zinc-950">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Không gian AI
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Phân tích bằng ngôn ngữ tự nhiên
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          AI sinh mã, bạn xem lại, chỉnh sửa, duyệt, rồi hệ thống chạy cục bộ.
        </p>
      </header>

      {/* Two-column layout */}
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Left: Chat + Explanation */}
        <div className="bg-white p-10 dark:bg-[#eeece7]">
          <Card>
            <CardHeader>
              <CardTitle>1. Yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>

          {request && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Giải thích</CardTitle>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardContent>
                {streaming.isStreaming && !streaming.explanation ? (
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#d4d4d8]" />
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-600">
                    {request.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show progress indicator during streaming */}
          {streaming.isStreaming && (
            <div className="mt-6">
              <GenerationProgress phase={generationPhase} />
            </div>
          )}
        </div>

        {/* Right: Monaco + Result */}
        <div className="bg-[#17171c] p-10">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-zinc-100">2. Mã Python</CardTitle>
            </CardHeader>
            <CardContent>
              {showSkeleton ? (
                <SkeletonLoader />
              ) : request ? (
                <>
                  <CodeBlock
                    value={request.edited_code ?? request.ai_code}
                    onChange={handleCodeChange}
                    readOnly={request.status === "executing" || streaming.isStreaming}
                  />

                  {showActions && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={request.status === "executing" || streaming.isStreaming}
                        className="flex-1"
                      >
                        Duyệt và chạy
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        disabled={request.status === "executing" || streaming.isStreaming}
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-64 items-center justify-center text-zinc-500">
                  Nhập yêu cầu bên trái để bắt đầu
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Kết quả
              </h3>
              <ResultPanel
                figures={result.figures}
                stdout={result.stdout}
                execution_time_ms={result.execution_time_ms}
                error_message={result.error_message}
                request_id={request?.id ?? null}
                prompt={result.prompt}
                status={
                  request?.status === "completed"
                    ? "completed"
                    : request?.status === "failed"
                      ? "failed"
                      : request?.status === "executing"
                        ? "executing"
                        : "idle"
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
