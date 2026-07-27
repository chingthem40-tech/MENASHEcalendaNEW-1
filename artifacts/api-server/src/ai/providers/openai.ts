/**
 * ai/providers/openai.ts
 *
 * OpenAI streaming adapter.
 * Model: gpt-4o-mini (fast, cost-efficient primary)
 * Falls back gracefully — gateway skips if OPENAI_API_KEY is absent.
 */
import OpenAI from "openai";
import { buildSystemPrompt } from "../systemPrompt";
import type { CalendarCtx } from "../types";
import type { ChatMessage } from "./gemini";

export { type ChatMessage };

/** Returns false when OPENAI_API_KEY is absent — gateway will skip this provider. */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function* streamOpenAI(
  messages: ChatMessage[],
  signal: AbortSignal,
  ctx?: CalendarCtx,
): AsyncIterable<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey });

  const systemPrompt = buildSystemPrompt(ctx);
  const history = messages.slice(-10);
  const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await client.chat.completions.create(
    {
      model: "gpt-4o-mini",
      messages: openAiMessages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    },
    { signal },
  );

  for await (const chunk of stream) {
    if (signal.aborted) return;
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
