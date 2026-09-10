import { useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function OutputPanel({
  title,
  value,
  onChange,
  filename,
  placeholder,
  isLoading,
  children,
  rows = 16,
}: {
  title: string;
  value: string;
  onChange?: (next: string) => void;
  filename: string;
  placeholder?: string;
  isLoading?: boolean;
  children?: ReactNode;
  rows?: number;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-display text-base">{title}</CardTitle>
        <div className="flex gap-2">
          <CopyButton text={value} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!value}
            onClick={() => downloadText(filename, value)}
          >
            <Download />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {children}
        {onChange ? (
          <Textarea
            value={isLoading ? "Working on it…" : value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={isLoading}
            rows={rows}
            placeholder={placeholder}
            className="min-h-[18rem] resize-y font-sans text-sm leading-relaxed"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
