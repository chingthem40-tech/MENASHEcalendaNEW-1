/**
 * ai/providers/grok.ts
 *
 * Grok streaming adapter via xAI's OpenAI-compatible API.
 * Uses the `openai` npm package pointed at https://api.x.ai/v1.
 * Model: grok-3-mini (fast, efficient fallback)
 */
import OpenAI from "openai";
import { buildSystemPrompt } from "../systemPrompt";
import type { CalendarCtx } from "../types";
import type { ChatMessage } from "./gemini";

export { type ChatMessage };

/** Returns false when GROK_API_KEY is absent — gateway will skip this provider. */
export function isGrokConfigured(): boolean {
  return !!process.env.GROK_API_KEY;
}

export async function* streamGrok(
  messages: ChatMessage[],
  signal: AbortSignal,
  ctx?: CalendarCtx,
): AsyncIterable<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("GROK_API_KEY is not configured");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  const systemPrompt = buildSystemPrompt(ctx);
  const history = messages.slice(-10);
  const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const stream = await client.chat.completions.create({
    model: "grok-3-mini",
    messages: openAiMessages,
    stream: true,
    max_tokens: 1024,
    temperature: 0.7,
  }, { signal });

  for await (const chunk of stream) {
    if (signal.aborted) return;
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield text;
  }
}
