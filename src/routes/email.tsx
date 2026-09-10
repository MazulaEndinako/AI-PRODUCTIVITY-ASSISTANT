import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, Sparkle } from "lucide-react";
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
import { generateEmail } from "@/lib/ai.functions";
import { logActivity } from "@/lib/workspace-store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator | Northlight AI Assistant" },
      {
        name: "description",
        content:
          "Draft formal, friendly or persuasive work emails in seconds, then edit, copy or export the result.",
      },
      { property: "og:title", content: "Smart Email Generator | Northlight" },
      {
        property: "og:description",
        content: "Draft work emails with tone control, then edit, copy or export them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

type Tone = "formal" | "friendly" | "persuasive";
type Length = "short" | "medium" | "detailed";

function EmailPage() {
  const run = useServerFn(generateEmail);
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [length, setLength] = useState<Length>("medium");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (!purpose.trim()) {
      toast.error("Tell the assistant what the email is about first.");
      return;
    }
    setLoading(true);
    try {
      const { text } = await run({ data: { purpose, recipient, keyPoints, tone, length } });
      setOutput(text);
      logActivity("email", purpose.slice(0, 60));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The email could not be generated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Smart Email Generator"
        description="Describe the situation, pick a tone, and get a ready-to-send draft you can edit."
      />
      <AiDisclaimer />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Mail className="size-4" /> Email brief
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">What is the email about?</Label>
              <Textarea
                id="purpose"
                rows={4}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ask the client for a two-week extension on the rollout and reassure them about quality."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Priya, Head of Operations at Vantage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Key points to include</Label>
              <Textarea
                id="points"
                rows={4}
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="New deadline 14 March; extra QA pass; no change to budget"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Length</Label>
                <Select value={length} onValueChange={(v) => setLength(v as Length)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={onGenerate} disabled={loading} className="w-full">
              <Sparkle />
              {loading ? "Writing draft…" : "Generate email"}
            </Button>
          </CardContent>
        </Card>

        <OutputPanel
          title="Draft"
          value={output}
          onChange={setOutput}
          isLoading={loading}
          filename="email-draft.txt"
          placeholder="Your draft will appear here, fully editable."
        />
      </div>
    </AppShell>
  );
}
