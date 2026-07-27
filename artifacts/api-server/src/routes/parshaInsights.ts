import { Router } from "express";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../lib/requireAuth";
import { aiRateLimiter } from "../lib/rateLimiter";
import { apiError } from "../lib/apiError";

const router = Router();

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

export interface ParshaInsight {
  parshaName: string;
  hebrewName: string;
  bookName: string;
  chaptersRange: string;
  keyTheme: string;
  didYouKnow: string;
  bneiManasheConnection: string;
  mainSources: string;
  classicalCommentary: string;
  practicalLesson: string;
  discussionQuestion: string;
  hebrewQuote: { hebrew: string; translation: string; reference: string };
  sourceReferences: string;
}

const bodySchema = z.object({
  parshaName: z.string().min(1).max(100),
  hebrewName: z.string().max(100).optional(),
  bookName: z.string().max(100).optional(),
  chaptersRange: z.string().max(50).optional(),
});

const cache = new Map<string, ParshaInsight>();

router.post("/parsha-insights", requireAuth, aiRateLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid request", parsed.error.issues);
  }

  const { parshaName, hebrewName, bookName, chaptersRange } = parsed.data;

  const cacheKey = parshaName.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  let genai: GoogleGenAI;
  try {
    genai = getGenAI();
  } catch {
    return apiError.unavailable(res, "AI service not configured");
  }

  const prompt = `You are a knowledgeable Jewish scholar providing Torah insights specifically relevant to the Bnei Menashe community — the Jewish community from Northeast India (Manipur and Mizoram) who are descendants of the lost tribe of Menashe and have made aliyah to Israel.

Provide insights for Parashat ${parshaName}${hebrewName ? ` (${hebrewName})` : ""}${bookName && chaptersRange ? `, ${bookName} ${chaptersRange}` : ""}.

Respond with a JSON object with exactly these fields:
- keyTheme: One central spiritual or ethical lesson from this parsha (2-3 sentences)
- didYouKnow: An interesting or lesser-known fact about this parsha (1-2 sentences)
- bneiManasheConnection: How this parsha's themes resonate with the Bnei Menashe journey (2-3 sentences)
- mainSources: The primary Torah sections and key references (1-2 sentences)
- classicalCommentary: What Rashi, Ramban, or other classical commentators say about this parsha's central theme (2-3 sentences)
- practicalLesson: A concrete, actionable lesson from this parsha for modern Jewish life (2-3 sentences)
- discussionQuestion: A thought-provoking question for Shabbat table discussion (1-2 sentences)
- hebrewQuote: An object with three fields — "hebrew" (a key verse in Hebrew), "translation" (English translation), "reference" (e.g. "Genesis 12:1")
- sourceReferences: A comma-separated list of key classical sources

Return only valid JSON, no markdown fences.`;

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const content = response.text ?? "{}";
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)```/) ??
      content.match(/```\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;

    const parsedAi = JSON.parse(jsonStr) as Omit<ParshaInsight, "parshaName" | "hebrewName" | "bookName" | "chaptersRange">;

    const result: ParshaInsight = {
      parshaName,
      hebrewName: hebrewName ?? "",
      bookName: bookName ?? "",
      chaptersRange: chaptersRange ?? "",
      keyTheme: parsedAi.keyTheme ?? "",
      didYouKnow: parsedAi.didYouKnow ?? "",
      bneiManasheConnection: parsedAi.bneiManasheConnection ?? "",
      mainSources: parsedAi.mainSources ?? "",
      classicalCommentary: parsedAi.classicalCommentary ?? "",
      practicalLesson: parsedAi.practicalLesson ?? "",
      discussionQuestion: parsedAi.discussionQuestion ?? "",
      hebrewQuote: parsedAi.hebrewQuote ?? { hebrew: "", translation: "", reference: "" },
      sourceReferences: parsedAi.sourceReferences ?? "",
    };

    cache.set(cacheKey, result);
    return res.json(result);
  } catch (err: any) {
    req.log.error(err);
    return apiError.internal(res, "Failed to generate Torah insights. Please try again.");
  }
});

export default router;
