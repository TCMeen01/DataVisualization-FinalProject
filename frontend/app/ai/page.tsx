"use client";

import { useEffect, useState } from "react";
import { MonacoEditor } from "@/components/ai/MonacoEditor";
import { ChatInput } from "@/components/ai/ChatInput";
import { CodeBlock } from "@/components/ai/CodeBlock";
import { ResultPanel } from "@/components/ai/ResultPanel";
import { StatusBadge } from "@/components/ai/StatusBadge";
import { NEUTRAL_COLORS, STATUS_COLORS } from "@/lib/constants";
import { toast } from "sonner";

interface AIRequest {
  id: string;
  prompt: string;
  code: string;
  explanation: string;
  status: "pending" | "edited" | "approved" | "executing" | "completed" | "failed" | "rejected";
  result?: string;
  error?: string;
  execution_time_ms?: number;
  created_at: string;
}

export default function AIPage() {
  const [requests, setRequests] = useState<AIRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<AIRequest | null>(null);
  const [editedCode, setEditedCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "history">("editor");

  // Load request history on mount
  useEffect(() => {
    loadRequestHistory();
  }, []);

  const loadRequestHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/logs?limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (prompt: string) => {
    try {
      setLoading(true);

      // Fetch dataset schema for context
      const schemaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/data/schema`
      );
      const schemaData = schemaResponse.ok ? await schemaResponse.json() : {};

      // Call AI generation endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ai/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            data_context: schemaData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const newRequest: AIRequest = {
        id: data.request_id,
        prompt,
        code: data.code,
        explanation: data.explanation,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      setCurrentRequest(newRequest);
      setEditedCode(data.code);
      toast.success("Code generated successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to generate code: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCode = async () => {
    if (!currentRequest) return;

    try {
      setExecuting(true);

      // Mark as approved and execute
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            request_id: currentRequest.id,
            code: editedCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Execution error: ${response.status}`);
      }

      const result = await response.json();

      const updatedRequest: AIRequest = {
        ...currentRequest,
        code: editedCode,
        status: "completed",
        result: result.stdout,
        error: result.stderr,
        execution_time_ms: result.execution_time_ms,
      };

      setCurrentRequest(updatedRequest);
      await loadRequestHistory();
      toast.success("Code executed successfully");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Execution failed: ${errorMsg}`);

      if (currentRequest) {
        const failedRequest: AIRequest = {
          ...currentRequest,
          code: editedCode,
          status: "failed",
          error: errorMsg,
        };
        setCurrentRequest(failedRequest);
      }
    } finally {
      setExecuting(false);
    }
  };

  const handleRejectCode = () => {
    if (currentRequest) {
      const rejectedRequest: AIRequest = {
        ...currentRequest,
        status: "rejected",
      };
      setCurrentRequest(rejectedRequest);
      toast.info("Code rejected");
    }
  };

  const handleEditCode = (newCode: string) => {
    setEditedCode(newCode);
    if (currentRequest) {
      setCurrentRequest({
        ...currentRequest,
        status: "edited",
      });
    }
  };

  const selectRequestFromHistory = (request: AIRequest) => {
    setCurrentRequest(request);
    setEditedCode(request.code);
    setActiveTab("editor");
  };

  return (
    <div className="p-6 h-screen flex flex-col" style={{ backgroundColor: NEUTRAL_COLORS.canvas }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: NEUTRAL_COLORS.muted }}>
          Hanoi Air Quality AI Analysis
        </h1>
        <p style={{ color: NEUTRAL_COLORS.muted }} className="opacity-75">
          Generate insights and analysis for PM2.5 data using AI
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "#e5e7eb" }}>
        <button
          onClick={() => setActiveTab("editor")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "editor"
              ? "border-b-2 text-emerald-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          style={{
            borderBottomColor: activeTab === "editor" ? "#10b981" : "transparent",
            color: activeTab === "editor" ? "#10b981" : "#4b5563",
          }}
        >
          Code Editor
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "border-b-2 text-emerald-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          style={{
            borderBottomColor: activeTab === "history" ? "#10b981" : "transparent",
            color: activeTab === "history" ? "#10b981" : "#4b5563",
          }}
        >
          Request History ({requests.length})
        </button>
      </div>

      {activeTab === "editor" ? (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Chat Input */}
          <ChatInput onSubmit={handleGenerateCode} disabled={loading} />

          {currentRequest ? (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
              {/* Code Editor */}
              <div className="flex flex-col gap-2 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold" style={{ color: NEUTRAL_COLORS.muted }}>
                    Generated Code
                  </h2>
                  <StatusBadge status={currentRequest.status} />
                </div>
                <div className="flex-1 border rounded overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                  <MonacoEditor code={editedCode} onChange={handleEditCode} />
                </div>
              </div>

              {/* Result Panel */}
              <div className="flex flex-col gap-2 overflow-hidden">
                <div>
                  <h2 className="font-semibold mb-2" style={{ color: NEUTRAL_COLORS.muted }}>
                    Explanation
                  </h2>
                  <div
                    className="p-4 rounded text-sm leading-relaxed overflow-y-auto"
                    style={{
                      backgroundColor: "#f9fafb",
                      color: NEUTRAL_COLORS.muted,
                      maxHeight: "200px",
                    }}
                  >
                    {currentRequest.explanation}
                  </div>
                </div>

                <ResultPanel request={currentRequest} />

                {/* Action Buttons */}
                {currentRequest.status === "pending" || currentRequest.status === "edited" ? (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleApproveCode}
                      disabled={executing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {executing ? "Executing..." : "Approve & Execute"}
                    </button>
                    <button
                      onClick={handleRejectCode}
                      disabled={executing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              className="flex-1 flex items-center justify-center rounded border-2 border-dashed"
              style={{ borderColor: "#e5e7eb", color: NEUTRAL_COLORS.muted }}
            >
              <div className="text-center">
                <p className="text-lg font-medium mb-2">No code generated yet</p>
                <p className="text-sm">Submit a prompt to generate AI insights</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {requests.length === 0 ? (
            <div className="flex items-center justify-center h-64" style={{ color: NEUTRAL_COLORS.muted }}>
              <p>No request history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <button
                  key={request.id}
                  onClick={() => selectRequestFromHistory(request)}
                  className="w-full p-4 rounded border text-left transition-all hover:shadow-md"
                  style={{
                    borderColor: "#e5e7eb",
                    backgroundColor: currentRequest?.id === request.id ? "#f0fdf4" : "#ffffff",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" style={{ color: NEUTRAL_COLORS.muted }}>
                        {request.prompt.substring(0, 100)}...
                      </p>
                      <p className="text-sm mt-1 opacity-75" style={{ color: NEUTRAL_COLORS.muted }}>
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
