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
    const { fileBase64, fileName } = await req.json();
    if (!fileBase64 || !fileName) {
      throw new Error("Missing fileBase64 or fileName");
    }

    const lowerName = fileName.toLowerCase();

    // Decode base64 to bytes
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    let extractedText = "";

    if (lowerName.endsWith(".pdf")) {
      // Use AI to extract text from PDF by sending it as an image/document
      // @ts-ignore
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Extract ALL the text content from this PDF document. Return ONLY the raw text, preserving paragraph structure. Do not add any commentary or headers.",
                },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: fileBase64,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI extraction error:", response.status, errText);
        throw new Error("Failed to extract text from PDF");
      }

      const data = await response.json();
      extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
      // For Word docs, use AI to extract text
      // @ts-ignore
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

      // Try to decode as text first (works for some .doc files)
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = decoder.decode(bytes);

      // Extract readable text portions (filter out binary garbage)
      const cleanedParts: string[] = [];
      const lines = rawText.split(/\r?\n/);
      for (const line of lines) {
        // Keep lines with mostly printable characters
        const printable = line.replace(/[^x20-x7Eu00A0-uFFFF]/g, "");
        if (printable.length > 10 && printable.length / Math.max(line.length, 1) > 0.5) {
          cleanedParts.push(printable.trim());
        }
      }

      if (cleanedParts.length > 5) {
        extractedText = cleanedParts.join("\n");
      } else {
        // Fallback: use AI to try to interpret the document
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GEMINI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemini-1.5-flash",
            messages: [
              {
                role: "user",
                content: `The following is raw text extracted from a Word document. Clean it up and return only the readable study content:\n\n${rawText.slice(0, 15000)}`,
              },
            ],
          }),
        });

        if (!response.ok) throw new Error("Failed to process Word document");
        const data = await response.json();
        extractedText = data.choices?.[0]?.message?.content || "";
      }
    } else {
      // Plain text fallback
      const decoder = new TextDecoder("utf-8");
      extractedText = decoder.decode(bytes);
    }

    return new Response(JSON.stringify({ text: extractedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-text error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
