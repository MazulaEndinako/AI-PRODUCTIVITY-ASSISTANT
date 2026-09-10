import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AiDisclaimer, AppShell, PageHeader } from "@/components/app-shell";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { CHAT_KEY, logActivity } from "@/lib/workspace-store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Assistant Chat | Northlight AI Assistant" },
      {
        name: "description",
        content:
          "Chat with a workplace productivity assistant for drafts, plans, summaries and quick answers.",
      },
      { property: "og:title", content: "AI Assistant Chat | Northlight" },
      {
        property: "og:description",
        content: "A workplace AI chat for drafts, plans, summaries and quick answers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Draft a status update for a slipping project",
  "Turn these bullet points into a crisp agenda",
  "How should I prioritise five competing deadlines?",
];

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CHAT_KEY);
      setInitial(raw ? (JSON.parse(raw) as UIMessage[]) : []);
    } catch {
      setInitial([]);
    }
  }, []);

  if (!initial) return null;
  return (
    <AppShell>
      <ChatSurface initialMessages={initial} />
    </AppShell>
  );
}

function ChatSurface({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [resetKey, setResetKey] = useState(0);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, setMessages } = useChat({
    id: `northlight-chat-${resetKey}`,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The assistant could not reply."),
  });
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    if (!isBusy) textareaRef.current?.focus();
  }, [isBusy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
    logActivity("chat", trimmed.slice(0, 60));
  }

  return (
    <>
      <PageHeader
        title="Assistant Chat"
        description="Ask anything about your work: drafts, plans, summaries or a second opinion."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMessages([]);
              window.localStorage.removeItem(CHAT_KEY);
              setResetKey((k) => k + 1);
            }}
          >
            <RotateCcw />
            New conversation
          </Button>
        }
      />
      <AiDisclaimer />

      <div className="flex h-[calc(100vh-19rem)] min-h-[26rem] flex-col rounded-xl border border-border bg-card">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Start a conversation"
                description="Try one of these to get going."
              >
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : null}

            {messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))}

            {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-border p-3">
          <PromptInput
            onSubmit={(_message, event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <PromptInputTextarea
              ref={textareaRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the assistant…"
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={!input.trim() && !isBusy} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
