import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Sparkle } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, AppShell, PageHeader } from "@/components/app-shell";
import { OutputPanel } from "@/components/output-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { researchTopic, type ResearchResult } from "@/lib/ai.functions";
import { logActivity } from "@/lib/workspace-store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant | Northlight AI Assistant" },
      {
        name: "description",
        content:
          "Summarise topics or pasted articles into a brief with key insights, open questions and next steps.",
      },
      { property: "og:title", content: "AI Research Assistant | Northlight" },
      {
        property: "og:description",
        content: "Topic and article briefs with insights, open questions and next steps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

type Depth = "brief" | "standard" | "deep";

function toMarkdown(topic: string, r: ResearchResult) {
  const section = (title: string, items: string[]) =>
    items.length ? [`## ${title}`, ...items.map((i) => `- ${i}`), ""] : [];
  return [
    `# ${topic}`,
    "",
    r.summary,
    "",
    ...section("Key insights", r.insights),
    ...section("Open questions", r.openQuestions),
    ...section("Next steps", r.nextSteps),
  ].join("\n");
}

function ResearchPage() {
  const run = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [material, setMaterial] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onResearch() {
    if (!topic.trim()) {
      toast.error("Add a topic or question first.");
      return;
    }
    setLoading(true);
    try {
      const res = await run({ data: { topic, material, depth } });
      setResult(res);
      setOutput(toMarkdown(topic, res));
      logActivity("research", topic.slice(0, 60));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The brief could not be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="AI Research Assistant"
        description="Summarise a topic or paste an article to get insights, open questions and next steps."
      />
      <AiDisclaimer />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Search className="size-4" /> Research brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic or question</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="How are mid-market SaaS teams pricing AI features?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Paste an article or notes (optional)</Label>
              <Textarea
                id="material"
                rows={14}
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Paste the source text to summarise…"
                className="min-h-[18rem]"
              />
            </div>
            <div className="space-y-2">
              <Label>Depth</Label>
              <Select value={depth} onValueChange={(v) => setDepth(v as Depth)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="deep">Deep dive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onResearch} disabled={loading} className="w-full">
              <Sparkle />
              {loading ? "Researching…" : "Create brief"}
            </Button>
          </CardContent>
        </Card>

        <OutputPanel
          title="Brief"
          value={output}
          onChange={setOutput}
          isLoading={loading}
          filename="research-brief.md"
          rows={14}
          placeholder="Your editable brief will appear here."
        >
          {result ? (
            <div className="space-y-3">
              <List title="Key insights" items={result.insights} />
              <List title="Open questions" items={result.openQuestions} />
              <List title="Next steps" items={result.nextSteps} />
            </div>
          ) : null}
        </OutputPanel>
      </div>
    </AppShell>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((i, idx) => (
          <li key={idx}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}
