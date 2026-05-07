"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] items-center justify-center bg-[#1e1e1e] text-zinc-400">
      Loading editor...
    </div>
  ),
});

interface CodeBlockProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function CodeBlock({ value, onChange, readOnly = false }: CodeBlockProps) {
  return (
    <div className="min-h-[300px] overflow-hidden rounded-lg border border-zinc-800">
      <MonacoEditor
        height="500px"
        language="python"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange?.(val || "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
