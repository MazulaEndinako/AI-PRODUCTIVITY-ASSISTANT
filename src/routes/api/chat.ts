import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getGatewayModel } from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        try {
          const result = streamText({
            model: getGatewayModel(),
            system: `You are Northlight, an AI workplace productivity assistant.
Be concise, practical and structured. Use markdown lists and short paragraphs.
When asked for drafts, plans or summaries, produce something ready to use.
If you are unsure, say so instead of inventing facts.`,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Chat failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
