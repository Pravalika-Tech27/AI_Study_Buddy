// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// @ts-ignore
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, text, question } = await req.json();
    // @ts-ignore
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

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

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-1.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("study-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
