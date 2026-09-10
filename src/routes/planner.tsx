import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CalendarClock, Sparkle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, AppShell, PageHeader } from "@/components/app-shell";
import { CopyButton, downloadText } from "@/components/output-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { planTasks } from "@/lib/ai.functions";
import { logActivity, newId, useTasks, type Priority, type Task } from "@/lib/workspace-store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner & Scheduler | Northlight AI Assistant" },
      {
        name: "description",
        content:
          "Turn a pile of goals into a prioritised daily or weekly schedule you can tick off and export.",
      },
      { property: "og:title", content: "AI Task Planner & Scheduler | Northlight" },
      {
        property: "og:description",
        content: "Prioritised daily and weekly plans generated from your goals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-accent text-accent-foreground border-accent-foreground/20",
  low: "bg-muted text-muted-foreground border-border",
};

function PlannerPage() {
  const run = useServerFn(planTasks);
  const [tasks, setTasks] = useTasks();
  const [goals, setGoals] = useState("");
  const [context, setContext] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const visible = useMemo(() => tasks.filter((t) => t.view === view), [tasks, view]);
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    visible.forEach((t) => map.set(t.day, [...(map.get(t.day) ?? []), t]));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  async function onPlan() {
    if (!goals.trim()) {
      toast.error("List what you need to get done first.");
      return;
    }
    setLoading(true);
    try {
      const result = await run({ data: { goals, view, hoursPerDay, context } });
      const generated: Task[] = result.tasks.map((t) => ({
        ...t,
        id: newId(),
        done: false,
        view,
      }));
      setTasks((prev) => [...prev.filter((t) => t.view !== view), ...generated]);
      setNote(result.note);
      logActivity("planner", `${view === "daily" ? "Daily" : "Weekly"} plan · ${generated.length} tasks`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The plan could not be created.");
    } finally {
      setLoading(false);
    }
  }

  const asText = visible
    .map((t) => `[${t.done ? "x" : " "}] ${t.day} · ${t.title} (${t.priority}, ${t.durationMins}m)`)
    .join("\n");

  return (
    <AppShell>
      <PageHeader
        title="AI Task Planner"
        description="Describe your workload and get a prioritised schedule for the day or the week."
      />
      <AiDisclaimer />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <CalendarClock className="size-4" /> Plan inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goals">Tasks and goals</Label>
              <Textarea
                id="goals"
                rows={9}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder={"Finish Q2 forecast\nReview design handoff\nPrep board update\n1:1s with team"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Constraints</Label>
              <Textarea
                id="context"
                rows={3}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="No meetings before 10:00; Friday is a half day"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Focus hours per day</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={16}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value) || 6)}
              />
            </div>
            <Button onClick={onPlan} disabled={loading} className="w-full">
              <Sparkle />
              {loading ? "Building schedule…" : `Generate ${view} plan`}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "weekly")}>
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <CopyButton text={asText} label="Copy plan" />
              <Button
                variant="outline"
                size="sm"
                disabled={!visible.length}
                onClick={() => downloadText(`${view}-plan.txt`, asText)}
              >
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
            {grouped.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No {view} tasks yet. Add your workload on the left and generate a plan.
              </p>
            ) : (
              grouped.map(([day, dayTasks]) => (
                <div key={day} className="space-y-2">
                  <p className="font-display text-sm font-semibold text-foreground">{day}</p>
                  <ul className="space-y-2">
                    {dayTasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                      >
                        <Checkbox
                          checked={task.done}
                          onCheckedChange={(checked) =>
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id ? { ...t, done: checked === true } : t,
                              ),
                            )
                          }
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium ${task.done ? "text-muted-foreground line-through" : ""}`}
                          >
                            {task.title}
                          </p>
                          {task.rationale ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{task.rationale}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className={PRIORITY_STYLES[task.priority]}>
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.durationMins}m
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                            aria-label={`Remove ${task.title}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
