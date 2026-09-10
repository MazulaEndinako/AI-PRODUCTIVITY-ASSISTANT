import { useCallback, useEffect, useState } from "react";

export type Priority = "high" | "medium" | "low";

export type Task = {
  id: string;
  title: string;
  day: string;
  priority: Priority;
  durationMins: number;
  rationale: string;
  done: boolean;
  view: "daily" | "weekly";
};

export type ActivityEntry = {
  id: string;
  tool: "email" | "notes" | "planner" | "research" | "chat";
  title: string;
  at: string;
};

const TASKS_KEY = "northlight.tasks";
const ACTIVITY_KEY = "northlight.activity";
export const CHAT_KEY = "northlight.chat";

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage full or unavailable */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}

export function useTasks() {
  return useLocalStorage<Task[]>(TASKS_KEY, []);
}

export function useActivity() {
  return useLocalStorage<ActivityEntry[]>(ACTIVITY_KEY, []);
}

export function logActivity(tool: ActivityEntry["tool"], title: string) {
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    const list = raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
    const next = [{ id: newId(), tool, title, at: new Date().toISOString() }, ...list].slice(0, 40);
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("northlight:activity"));
  } catch {
    /* ignore */
  }
}

export const TOOL_LABELS: Record<ActivityEntry["tool"], string> = {
  email: "Email draft",
  notes: "Meeting summary",
  planner: "Task plan",
  research: "Research brief",
  chat: "Assistant chat",
};
