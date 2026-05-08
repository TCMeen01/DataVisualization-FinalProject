"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="VD: Vẽ heatmap tỉ lệ short-form theo kênh và năm"
        className="min-h-[120px]"
        disabled={isLoading}
      />
      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang sinh code...
          </>
        ) : (
          "Sinh code"
        )}
      </Button>
      <p className="text-xs text-zinc-500">
        Mẹo: Nhấn Ctrl+Enter để gửi nhanh
      </p>
    </div>
  );
}
