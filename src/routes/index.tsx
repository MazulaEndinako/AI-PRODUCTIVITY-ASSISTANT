import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Mail,
  MessageSquare,
  Search,
  Timer,
} from "lucide-react";
import { AiDisclaimer, AppShell, PageHeader } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TOOL_LABELS, useActivity, useTasks, type ActivityEntry } from "@/lib/workspace-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Northlight | AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "One workspace for AI email drafts, meeting summaries, task planning, research briefs and an assistant chat.",
      },
      { property: "og:title", content: "Northlight | AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "AI email drafts, meeting summaries, task plans, research briefs and assistant chat in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const TOOLS = [
  {
    to: "/email",
    label: "Smart Email Generator",
    blurb: "Formal, friendly or persuasive drafts from a short brief.",
    icon: Mail,
  },
  {
    to: "/notes",
    label: "Meeting Notes Summarizer",
    blurb: "Action items, decisions and deadlines pulled from raw notes.",
    icon: ClipboardList,
  },
  {
    to: "/planner",
    label: "AI Task Planner",
    blurb: "Prioritised daily and weekly schedules you can tick off.",
    icon: CalendarClock,
  },
  {
    to: "/research",
    label: "Research Assistant",
    blurb: "Topic and article briefs with insights and next steps.",
    icon: Search,
  },
  {
    to: "/chat",
    label: "Assistant Chat",
    blurb: "Ask anything and iterate in a conversation.",
    icon: MessageSquare,
  },
] as const;

function Overview() {
  const [tasks] = useTasks();
  const [activity, , hydrated] = useActivity();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener("northlight:activity", handler);
    return () => window.removeEventListener("northlight:activity", handler);
  }, []);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.done).length;
    const focusMins = tasks.filter((t) => !t.done).reduce((sum, t) => sum + t.durationMins, 0);
    const drafts = activity.filter((a) => a.tool === "email").length;
    const summaries = activity.filter((a) => a.tool === "notes" || a.tool === "research").length;
    return { total: tasks.length, done, focusMins, drafts, summaries };
  }, [tasks, activity, tick]);

  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <AppShell>
      <PageHeader
        title="Your workday, assisted"
        description="Five AI tools for the writing, planning and reading that fills your calendar."
        action={
          <Button asChild>
            <Link to="/chat">
              Open assistant <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Tasks scheduled"
          value={String(stats.total)}
          hint={`${stats.done} completed`}
          icon={CalendarClock}
        />
        <Metric
          label="Plan completion"
          value={`${completion}%`}
          hint="Across daily and weekly views"
          icon={CheckCircle2}
        >
          <Progress value={completion} className="mt-3 h-1.5" />
        </Metric>
        <Metric
          label="Focus time queued"
          value={`${Math.round(stats.focusMins / 60)}h`}
          hint={`${stats.focusMins} minutes of open work`}
          icon={Timer}
        />
        <Metric
          label="AI outputs"
          value={String(stats.drafts + stats.summaries)}
          hint={`${stats.drafts} drafts · ${stats.summaries} summaries`}
          icon={Mail}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-secondary/60"
            >
              <tool.icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-base font-semibold">{tool.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tool.blurb}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="font-display text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hydrated || activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet. Generate an email, summary or plan and it will show up here.
              </p>
            ) : (
              activity.slice(0, 8).map((entry: ActivityEntry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {TOOL_LABELS[entry.tool]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AiDisclaimer />
    </AppShell>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Mail;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        {children}
      </CardContent>
    </Card>
  );
}
