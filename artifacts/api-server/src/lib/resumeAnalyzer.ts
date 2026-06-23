import fs from "fs";
// pdf-parse v1 is externalized in esbuild (CJS) — loaded via require shim
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require("pdf-parse");
import OpenAI from "openai";
import { db, resumesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const apiKey = process.env.OPENAI_API_KEY ?? "";
const isOpenRouter = apiKey.startsWith("sk-or-");

const openai = new OpenAI({
  apiKey,
  ...(isOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
});

async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    logger.error({ err, filePath }, "PDF extraction failed");
    throw new Error("Failed to extract text from PDF");
  }
}

interface AnalysisResult {
  atsScore: number;
  skills: string[];
  missingSkills: string[];
  suggestions: string[];
  education: string;
  experience: string;
  projects: string;
}

async function runAiAnalysis(text: string): Promise<AnalysisResult> {
  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer.

Analyze the following resume text and provide a detailed evaluation. Return a JSON object with exactly these fields:

{
  "atsScore": <integer 0-100, ATS compatibility score>,
  "skills": <array of strings, technical and soft skills found in the resume>,
  "missingSkills": <array of strings, important skills commonly required that are missing from this resume>,
  "suggestions": <array of strings, specific actionable improvement suggestions>,
  "education": <string, summary of education background>,
  "experience": <string, summary of work experience>,
  "projects": <string, summary of projects mentioned>
}

ATS Score criteria:
- 90-100: Excellent — strong keywords, clear formatting, complete sections
- 70-89: Good — mostly ATS-friendly with minor gaps
- 50-69: Fair — some ATS issues, missing keywords
- Below 50: Poor — major ATS issues

Resume text:
${text.slice(0, 8000)}

Respond with only valid JSON, no markdown, no extra text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? "";

  try {
    return JSON.parse(content) as AnalysisResult;
  } catch {
    logger.error({ content }, "Failed to parse AI response as JSON");
    throw new Error("Invalid AI response format");
  }
}

export async function analyzeResume(
  resumeId: number,
  filePath: string | null,
  existingText?: string,
): Promise<void> {
  try {
    let text = existingText ?? "";

    if (filePath && !existingText) {
      text = await extractTextFromPdf(filePath);
    }

    if (!text.trim()) {
      await db
        .update(resumesTable)
        .set({ status: "failed" })
        .where(eq(resumesTable.id, resumeId));
      return;
    }

    const analysis = await runAiAnalysis(text);

    await db
      .update(resumesTable)
      .set({
        status: "done",
        extractedText: text.slice(0, 50000),
        atsScore: analysis.atsScore,
        skills: JSON.stringify(analysis.skills),
        missingSkills: JSON.stringify(analysis.missingSkills),
        suggestions: JSON.stringify(analysis.suggestions),
        education: analysis.education,
        experience: analysis.experience,
        projects: analysis.projects,
      })
      .where(eq(resumesTable.id, resumeId));

    logger.info({ resumeId, atsScore: analysis.atsScore }, "Resume analysis complete");
  } catch (err) {
    logger.error({ err, resumeId }, "Resume analysis error");
    await db
      .update(resumesTable)
      .set({ status: "failed" })
      .where(eq(resumesTable.id, resumeId));
  }
}
