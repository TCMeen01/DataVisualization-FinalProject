"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface StreamingState {
  isStreaming: boolean;
  code: string;
  explanation: string;
  error: string | null;
  requestId: string | null;
}

export interface UseStreamingResponseOptions {
  onComplete?: (requestId: string) => void;
  onError?: (error: string) => void;
  maxRetries?: number;
  enableStreaming?: boolean;
}

/**
 * Hook for streaming AI responses via SSE
 * Handles connection, parsing, retries, and fallback to non-streaming
 */
export function useStreamingResponse(options: UseStreamingResponseOptions = {}) {
  const {
    onComplete,
    onError,
    maxRetries = 3,
    enableStreaming = true,
  } = options;

  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    code: "",
    explanation: "",
    error: null,
    requestId: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fallback to non-streaming endpoint
  const fallbackToNonStreaming = useCallback(
    async (prompt: string, dataContext?: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, isStreaming: true, error: null }));

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ai/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, data_context: dataContext }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setState({
          isStreaming: false,
          code: data.code || "",
          explanation: data.explanation || "",
          error: null,
          requestId: data.request_id || null,
        });

        if (onComplete && data.request_id) {
          onComplete(data.request_id);
        }
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : "Failed to generate code";
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: errorMsg,
        }));
        if (onError) {
          onError(errorMsg);
        }
      }
    },
    [onComplete, onError]
  );

  const startStreaming = useCallback(
    async (prompt: string, dataContext?: Record<string, unknown>) => {
      // Check if streaming is enabled
      if (!enableStreaming) {
        // Fallback to non-streaming
        return fallbackToNonStreaming(prompt, dataContext);
      }

      // Reset retry count at the start
      retryCountRef.current = 0;

      // Internal retry function
      const attemptStream = async (): Promise<void> => {
        // Reset state
        setState({
          isStreaming: true,
          code: "",
          explanation: "",
          error: null,
          requestId: null,
        });

        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ai/generate-stream`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt, data_context: dataContext }),
              signal: abortControllerRef.current.signal,
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          if (!response.body) {
            throw new Error("Response body is null");
          }

          // Parse SSE stream
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  setState((prev) => ({
                    ...prev,
                    code: parsed.code || prev.code,
                    explanation: parsed.explanation || prev.explanation,
                  }));
                } catch {
                  console.warn("Failed to parse SSE data:", data);
                }
              } else if (line.startsWith("event: done")) {
                // Extract request_id from next data line
                const nextLine = lines[lines.indexOf(line) + 1];
                if (nextLine?.startsWith("data: ")) {
                  try {
                    const doneData = JSON.parse(nextLine.slice(6));
                    const requestId = doneData.request_id;
                    setState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      requestId,
                    }));
                    if (onComplete && requestId) {
                      onComplete(requestId);
                    }
                  } catch {
                    console.warn("Failed to parse done event data");
                  }
                }
              } else if (line.startsWith("event: error")) {
                const nextLine = lines[lines.indexOf(line) + 1];
                if (nextLine?.startsWith("data: ")) {
                  try {
                    const errorData = JSON.parse(nextLine.slice(6));
                    const errorMsg = errorData.error || "Unknown error";
                    setState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      error: errorMsg,
                    }));
                    if (onError) {
                      onError(errorMsg);
                    }
                  } catch {
                    console.warn("Failed to parse error event data");
                  }
                }
              }
            }
          }

          // Reset retry count on success
          retryCountRef.current = 0;
        } catch (error: unknown) {
          // Handle connection errors with exponential backoff retry
          const err = error as { name?: string };
          if (err.name === "AbortError") {
            // User cancelled, don't retry
            setState((prev) => ({ ...prev, isStreaming: false }));
            return;
          }

          retryCountRef.current += 1;

          if (retryCountRef.current < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
            console.log(
              `Retry ${retryCountRef.current}/${maxRetries} after ${delay}ms`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return attemptStream();
          } else {
            // Max retries reached, fallback to non-streaming
            console.log("Max retries reached, falling back to non-streaming");
            return fallbackToNonStreaming(prompt, dataContext);
          }
        }
      };

      return attemptStream();
    },
    [enableStreaming, maxRetries, onComplete, onError, fallbackToNonStreaming]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return {
    ...state,
    startStreaming,
    cancel,
  };
}
