import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export interface GeminiAnalysis {
  category: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  priority_score: number;
  summary: string;
  tags: string[];
}

export const analyseFeedback = async (
  title: string,
  description: string
): Promise<GeminiAnalysis | null> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyse this product feedback. Return ONLY valid JSON with no markdown or code blocks.
{
  "category": "Bug | Feature Request | Improvement | Other",
  "sentiment": "Positive | Neutral | Negative",
  "priority_score": 1-10,
  "summary": "one sentence summary",
  "tags": ["tag1", "tag2"]
}

Title: ${title}
Description: ${description}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text) as GeminiAnalysis;
    return parsed;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};