/**
 * ai/providers/gemini.ts
 *
 * Gemini streaming adapter.
 * Uses @google/genai with gemini-2.5-flash via SSE streaming.
 */
import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "../systemPrompt";
import type { CalendarCtx } from "../types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Returns false when GOOGLE_API_KEY is absent — gateway will skip this provider. */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_API_KEY;
}

export async function* streamGemini(
  messages: ChatMessage[],
  signal: AbortSignal,
  ctx?: CalendarCtx,
): AsyncIterable<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not configured");

  const genai = new GoogleGenAI({ apiKey });

  const systemPrompt = buildSystemPrompt(ctx);
  const history = messages.slice(-10);
  const lastMessage = history[history.length - 1];
  const priorMessages = history.slice(0, -1);

  const contents = priorMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = genai.chats.create({
    model: "gemini-2.5-flash",
    config: { systemInstruction: systemPrompt },
    history: contents,
  });

  const stream = await chat.sendMessageStream({ message: lastMessage.content });

  for await (const chunk of stream) {
    if (signal.aborted) return;
    const text = chunk.text;
    if (text) yield text;
  }
}
