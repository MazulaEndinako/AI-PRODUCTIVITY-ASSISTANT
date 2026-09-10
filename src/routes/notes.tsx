import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ClipboardList, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, AppShell, PageHeader } from "@/components/app-shell";
import { OutputPanel } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai.functions";
import { logActivity } from "@/lib/workspace-store";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer | Northlight AI Assistant" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into a summary with action items, owners, decisions and deadlines.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer | Northlight" },
      {
        property: "og:description",
        content: "Extract action items, decisions and deadlines from messy meeting notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotesPage,
});

function toMarkdown(s: MeetingSummary) {
  const lines = ["# Meeting summary", "", s.summary, ""];
  if (s.actionItems.length) {
    lines.push("## Action items");
    s.actionItems.forEach((a) => lines.push(`- ${a.task} — ${a.owner} (due ${a.due})`));
    lines.push("");
  }
  if (s.decisions.length) {
    lines.push("## Decisions");
    s.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push("");
  }
  if (s.deadlines.length) {
    lines.push("## Deadlines");
    s.deadlines.forEach((d) => lines.push(`- ${d.item}: ${d.date}`));
    lines.push("");
  }
  if (s.risks.length) {
    lines.push("## Risks and follow-ups");
    s.risks.forEach((r) => lines.push(`- ${r}`));
  }
  return lines.join("\n");
}

function NotesPage() {
  const run = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<MeetingSummary | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSummarize() {
    if (!notes.trim()) {
      toast.error("Paste your meeting notes first.");
      return;
    }
    setLoading(true);
    try {
      const summary = await run({ data: { notes, context } });
      setResult(summary);
      setOutput(toMarkdown(summary));
      logActivity("notes", context || "Meeting notes summarized");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The notes could not be summarized.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Paste transcripts or scribbles and get action items, decisions and deadlines you can share."
      />
      <AiDisclaimer />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <ClipboardList className="size-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="context">Meeting title or context</Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Weekly product sync, 12 March"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Raw notes or transcript</Label>
              <Textarea
                id="notes"
                rows={16}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste everything, however messy…"
                className="min-h-[20rem]"
              />
            </div>
            <Button onClick={onSummarize} disabled={loading} className="w-full">
              <Sparkle />
              {loading ? "Reading notes…" : "Summarize notes"}
            </Button>
          </CardContent>
        </Card>

        <OutputPanel
          title="Structured summary"
          value={output}
          onChange={setOutput}
          isLoading={loading}
          filename="meeting-summary.md"
          rows={14}
          placeholder="The editable summary will appear here."
        >
          {result ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <StatBlock label="Action items" items={result.actionItems.map((a) => a.task)} />
              <StatBlock label="Decisions" items={result.decisions} />
              <StatBlock
                label="Deadlines"
                items={result.deadlines.map((d) => `${d.item} — ${d.date}`)}
              />
              <StatBlock label="Risks" items={result.risks} />
            </div>
          ) : null}
        </OutputPanel>
      </div>
    </AppShell>
  );
}

function StatBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} ({items.length})
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.length ? (
          items.map((i, idx) => (
            <li key={idx} className="leading-snug">
              • {i}
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">None found</li>
        )}
      </ul>
    </div>
  );
}
