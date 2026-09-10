import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { getGatewayModel } from "./ai-gateway.server";

async function runPrompt(system: string, prompt: string) {
  const result = streamText({
    model: getGatewayModel(),
    system,
    prompt,
  });
  return await result.text;
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text) as string;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The assistant returned an unexpected format.");
  return JSON.parse(raw.slice(start, end + 1));
}

/* ---------------- Email generator ---------------- */

const EmailInput = z.object({
  purpose: z.string().min(1),
  recipient: z.string().default(""),
  tone: z.enum(["formal", "friendly", "persuasive"]),
  keyPoints: z.string().default(""),
  length: z.enum(["short", "medium", "detailed"]).default("medium"),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const text = await runPrompt(
      `You are an expert workplace communication assistant. Write ready-to-send emails.
Return plain text only: a "Subject:" line, then a blank line, then the email body.
Never include placeholders like [Name] unless the user gave no name.`,
      `Tone: ${data.tone}
Length: ${data.length}
Recipient: ${data.recipient || "unspecified"}
Purpose: ${data.purpose}
Key points to include: ${data.keyPoints || "none provided"}`,
    );
    return { text };
  });

/* ---------------- Meeting notes summarizer ---------------- */

const NotesInput = z.object({ notes: z.string().min(1), context: z.string().default("") });

export type MeetingSummary = {
  summary: string;
  actionItems: { task: string; owner: string; due: string }[];
  decisions: string[];
  deadlines: { item: string; date: string }[];
  risks: string[];
};

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NotesInput.parse(input))
  .handler(async ({ data }): Promise<MeetingSummary> => {
    const text = await runPrompt(
      `You summarize meeting notes for busy teams. Respond with JSON only, no commentary, using this shape:
{"summary": string, "actionItems": [{"task": string, "owner": string, "due": string}], "decisions": [string], "deadlines": [{"item": string, "date": string}], "risks": [string]}
Use "Unassigned" or "No date" when the notes do not say. Keep the summary under 120 words and at most 10 items per list.`,
      `Extra context: ${data.context || "none"}

Meeting notes:
${data.notes}`,
    );
    const parsed = extractJson(text) as Partial<MeetingSummary>;
    return {
      summary: parsed.summary ?? "",
      actionItems: (parsed.actionItems ?? []).slice(0, 10),
      decisions: (parsed.decisions ?? []).slice(0, 10),
      deadlines: (parsed.deadlines ?? []).slice(0, 10),
      risks: (parsed.risks ?? []).slice(0, 10),
    };
  });

/* ---------------- Task planner ---------------- */

const PlanInput = z.object({
  goals: z.string().min(1),
  view: z.enum(["daily", "weekly"]),
  hoursPerDay: z.number().min(1).max(16).default(6),
  context: z.string().default(""),
});

export type PlannedTask = {
  title: string;
  day: string;
  priority: "high" | "medium" | "low";
  durationMins: number;
  rationale: string;
};

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }): Promise<{ tasks: PlannedTask[]; note: string }> => {
    const text = await runPrompt(
      `You are a pragmatic scheduling assistant. Respond with JSON only, no commentary:
{"note": string, "tasks": [{"title": string, "day": string, "priority": "high"|"medium"|"low", "durationMins": number, "rationale": string}]}
For a daily plan use time blocks like "09:00" as the day value. For a weekly plan use weekday names (Monday..Friday).
Return at most 14 tasks. Keep each rationale under 20 words. Respect the available hours per day.`,
      `View: ${data.view}
Available focus hours per day: ${data.hoursPerDay}
Context: ${data.context || "none"}

Goals and tasks:
${data.goals}`,
    );
    const parsed = extractJson(text) as { note?: string; tasks?: PlannedTask[] };
    return {
      note: parsed.note ?? "",
      tasks: (parsed.tasks ?? []).slice(0, 14).map((t) => ({
        title: String(t.title ?? "Untitled"),
        day: String(t.day ?? ""),
        priority: (["high", "medium", "low"] as const).includes(t.priority) ? t.priority : "medium",
        durationMins: Number(t.durationMins) || 30,
        rationale: String(t.rationale ?? ""),
      })),
    };
  });

/* ---------------- Research assistant ---------------- */

const ResearchInput = z.object({
  topic: z.string().min(1),
  material: z.string().default(""),
  depth: z.enum(["brief", "standard", "deep"]).default("standard"),
});

export type ResearchResult = {
  summary: string;
  insights: string[];
  openQuestions: string[];
  nextSteps: string[];
};

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }): Promise<ResearchResult> => {
    const text = await runPrompt(
      `You are a research analyst. Respond with JSON only, no commentary:
{"summary": string, "insights": [string], "openQuestions": [string], "nextSteps": [string]}
Base the answer on the supplied material when present; otherwise use general knowledge and say so in the summary.
At most 6 items per list. Do not invent statistics or citations.`,
      `Topic: ${data.topic}
Depth: ${data.depth}

Article or material to analyse:
${data.material || "none supplied"}`,
    );
    const parsed = extractJson(text) as Partial<ResearchResult>;
    return {
      summary: parsed.summary ?? "",
      insights: (parsed.insights ?? []).slice(0, 6),
      openQuestions: (parsed.openQuestions ?? []).slice(0, 6),
      nextSteps: (parsed.nextSteps ?? []).slice(0, 6),
    };
  });
