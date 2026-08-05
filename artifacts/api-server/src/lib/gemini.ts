import { GoogleGenAI } from "@google/genai";

if (!process.env.Google_API_Key) {
  throw new Error("Google_API_Key environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: process.env.Google_API_Key });

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are an expert AI Career Assistant with deep expertise in:
- Resume Review & ATS Optimization
- Technical & HR Interview Preparation
- Skill Gap Analysis & Learning Roadmaps
- Career Guidance & Job Search Strategy
- LinkedIn & Professional Profile Improvement
- Portfolio & Project Recommendations
- Certification Suggestions
- Salary Negotiation & Offer Evaluation

When the user has provided a resume and/or job description, always reference them in your responses to give personalized, actionable advice. Never hallucinate or invent details not present in the provided context.

If resume or job description is missing and relevant to the question, kindly ask the user to provide it in their profile for more personalized advice.

Always provide:
- Concise, professional responses
- Bullet points where appropriate
- Clear strengths and areas for improvement
- Specific, actionable next steps
- Honest assessments without sugarcoating

Do NOT use emojis. Be direct and professional.`;

export async function generateCareerResponse(
  userMessage: string,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  resume?: string | null,
  jobDescription?: string | null
): Promise<string> {
  let contextPrefix = "";

  if (resume || jobDescription) {
    contextPrefix = "=== USER CONTEXT ===\n";
    if (resume) {
      contextPrefix += `RESUME:\n${resume.slice(0, 10000)}\n\n`;
    }
    if (jobDescription) {
      contextPrefix += `JOB DESCRIPTION:\n${jobDescription.slice(0, 5000)}\n\n`;
    }
    contextPrefix += "=== END CONTEXT ===\n\n";
  }

  const chat = ai.chats.create({
    model: MODEL,
    config: { systemInstruction: SYSTEM_PROMPT },
    history,
  });

  const response = await chat.sendMessage({
    message: contextPrefix + userMessage,
  });

  return response.text ?? "";
}
