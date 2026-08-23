import type { Flashcard } from "@/components/FlashcardView";
import type { QuizQuestion } from "@/components/QuizView";

async function callStudyAI(body: Record<string, string>): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is missing in .env");

  const { type, text, question } = body;
  let systemPrompt = "";
  let userPrompt = "";

  switch (type) {
    case "summary":
      systemPrompt = "You are an expert study assistant. Create concise, well-structured summaries.";
      userPrompt = `Summarize the following study notes into concise bullet points organized by topic. Use markdown formatting with headers and bullet points.\n\nNotes:\n${text}`;
      break;
    case "flashcards":
      systemPrompt = "You are an expert study assistant. Generate flashcards in the exact JSON format requested.";
      userPrompt = `Generate 8-10 flashcards from the following notes. Return ONLY a valid JSON array with objects containing "question" and "answer" fields. No markdown, no explanation.\n\nNotes:\n${text}`;
      break;
    case "quiz":
      systemPrompt = "You are an expert study assistant. Generate quiz questions in the exact JSON format requested.";
      userPrompt = `Generate 5 multiple choice questions from the following notes. Return ONLY a valid JSON array with objects containing "question" (string), "options" (array of 4 strings), and "correctAnswer" (number 0-3 indicating the correct option index). No markdown, no explanation.\n\nNotes:\n${text}`;
      break;
    case "chat":
      systemPrompt = "You are a helpful study assistant. Answer questions based on the provided study notes. Be concise and accurate. Use markdown formatting.";
      userPrompt = `Study Notes:\n${text}\n\nQuestion: ${question}`;
      break;
    default:
      throw new Error("Invalid type");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{
        role: "user",
        parts: [{ text: userPrompt }]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function generateSummary(text: string): Promise<string> {
  return callStudyAI({ type: "summary", text });
}

export async function generateFlashcards(text: string): Promise<Flashcard[]> {
  const content = await callStudyAI({ type: "flashcards", text });
  try {
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(content);
  } catch {
    // Fallback parsing
    console.error("Failed to parse flashcards JSON:", content);
    return [{ question: "Error parsing flashcards", answer: "Please try again." }];
  }
}

export async function generateQuiz(text: string): Promise<QuizQuestion[]> {
  const content = await callStudyAI({ type: "quiz", text });
  try {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return JSON.parse(content);
  } catch {
    console.error("Failed to parse quiz JSON:", content);
    return [{
      question: "Error parsing quiz",
      options: ["Please try again", "Retry", "Refresh", "None"],
      correctAnswer: 0,
    }];
  }
}

export async function askQuestion(text: string, question: string): Promise<string> {
  return callStudyAI({ type: "chat", text, question });
}
