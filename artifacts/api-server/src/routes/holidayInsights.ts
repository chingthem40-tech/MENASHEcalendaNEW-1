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

interface HolidayInsight {
  holidayName: string;
  hebrewName: string;
  overview: string;
  observances: string;
  mussarLesson: string;
  spiritualTheme: string;
  bneiManasheConnection: string;
}

const bodySchema = z.object({
  holidayName: z.string().min(1).max(100),
  hebrewName: z.string().max(100).optional(),
  timing: z.string().max(100).optional(),
});

const cache = new Map<string, HolidayInsight>();

router.post("/holiday-insights", requireAuth, aiRateLimiter, async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return apiError.badRequest(res, "Invalid request", parsed.error.issues);
  }

  const { holidayName, hebrewName, timing } = parsed.data;

  const cacheKey = holidayName.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  let genai: GoogleGenAI;
  try {
    genai = getGenAI();
  } catch {
    return apiError.unavailable(res, "AI service not configured");
  }

  const prompt = `You are a knowledgeable Jewish Mussar teacher and scholar providing holiday insights tailored for the Bnei Menashe community — the Jewish community from Northeast India (Manipur and Mizoram), descendants of the lost tribe of Menashe, who have made aliyah to Israel.

Provide deep Mussar-focused insights for: ${holidayName}${hebrewName ? ` (${hebrewName})` : ""}${timing ? `, observed on ${timing}` : ""}.

Respond with a JSON object with exactly these fields:
- overview: A 3-4 sentence description of the holiday's origins, significance, and place in the Jewish calendar
- observances: The main mitzvot, customs, and rituals observed (2-3 sentences)
- mussarLesson: The central Mussar (character refinement) teaching of this holiday — which middah (character trait) it develops, what personal work it demands, and how Mussar masters (Ramchal, Rav Salanter, Vilna Gaon) understood its ethical message. (3-4 sentences, richly detailed)
- spiritualTheme: The central spiritual message or lesson this holiday conveys (2-3 sentences)
- bneiManasheConnection: How this holiday's themes uniquely resonate with the Bnei Menashe experience — their journey of return, tribal identity, aliyah, or life in Israel (2-3 sentences)

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

    const parsedAi = JSON.parse(jsonStr) as Omit<HolidayInsight, "holidayName" | "hebrewName">;

    const result: HolidayInsight = {
      holidayName,
      hebrewName: hebrewName ?? "",
      overview: parsedAi.overview ?? "",
      observances: parsedAi.observances ?? "",
      mussarLesson: parsedAi.mussarLesson ?? "",
      spiritualTheme: parsedAi.spiritualTheme ?? "",
      bneiManasheConnection: parsedAi.bneiManasheConnection ?? "",
    };

    cache.set(cacheKey, result);
    return res.json(result);
  } catch (err: any) {
    req.log.error(err);
    return apiError.internal(res, "Failed to generate holiday insights. Please try again.");
  }
});

export default router;
