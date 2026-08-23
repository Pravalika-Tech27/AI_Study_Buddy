import { useState, useCallback } from "react";
import { Upload, FileText, X, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadAreaProps {
  onTextSubmit: (text: string, fileName: string) => void;
  isProcessing: boolean;
}

const ACCEPTED_TYPES = [
  ".txt", ".md", ".pdf",
  ".doc", ".docx",
];

const UploadArea = ({ onTextSubmit, isProcessing }: UploadAreaProps) => {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const isDocumentFile = (file: File) => {
    const name = file.name.toLowerCase();
    return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
  };

  const handleTextFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  }, []);

  const handleDocumentFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setIsExtracting(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not configured in .env");
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const lowerName = file.name.toLowerCase();
      let extractedText = "";

      if (lowerName.endsWith(".pdf")) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: "Extract ALL the text content from this PDF document. Return ONLY the raw text, preserving paragraph structure. Do not add any commentary or headers." },
                { inlineData: { mimeType: "application/pdf", data: base64 } }
              ]
            }]
          })
        });
        
        if (!response.ok) throw new Error("Failed to extract text from PDF");
        const data = await response.json();
        extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (lowerName.endsWith(".doc") || lowerName.endsWith(".docx")) {
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const rawText = decoder.decode(bytes);
        const cleanedParts: string[] = [];
        const lines = rawText.split(/\r?\n/);
        for (const line of lines) {
          const printable = line.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "");
          if (printable.length > 10 && printable.length / Math.max(line.length, 1) > 0.5) {
            cleanedParts.push(printable.trim());
          }
        }
        
        if (cleanedParts.length > 5) {
          extractedText = cleanedParts.join("\n");
        } else {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{ text: `The following is raw text extracted from a Word document. Clean it up and return only the readable study content:\n\n${rawText.slice(0, 15000)}` }]
              }]
            })
          });
          if (!response.ok) throw new Error("Failed to process Word document");
          const data = await response.json();
          extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      } else {
        const decoder = new TextDecoder("utf-8");
        extractedText = decoder.decode(bytes);
      }

      setText(extractedText);
      toast.success(`Extracted text from ${file.name}`);
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error(err instanceof Error && err.message.includes("VITE_GEMINI_API_KEY") 
        ? "Please set your Gemini API key in the .env file!" 
        : "Failed to extract text. Try pasting content manually.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (isDocumentFile(file)) {
        handleDocumentFile(file);
      } else {
        handleTextFile(file);
      }
    },
    [handleTextFile, handleDocumentFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text, fileName || "Pasted Notes");
    }
  };

  const processing = isProcessing || isExtracting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          isDragging
            ? "border-accent bg-accent/5 shadow-glow"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            {isExtracting ? (
              <FileUp className="h-6 w-6 text-primary animate-bounce" />
            ) : (
              <Upload className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              {isExtracting ? "Extracting text..." : "Drop your notes here"}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, Word (.doc/.docx), TXT, Markdown — or paste text below
            </p>
          </div>
          <label>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />
            <span className="cursor-pointer text-sm font-medium text-accent hover:text-accent/80 transition-colors">
              Browse files
            </span>
          </label>
        </div>
      </div>

      <AnimatePresence>
        {fileName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg bg-primary/5 p-3"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{fileName}</span>
            <button
              onClick={() => {
                setFileName("");
                setText("");
              }}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Or paste your study notes here..."
        className="w-full min-h-[200px] rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all font-body"
      />

      <Button
        onClick={handleSubmit}
        disabled={!text.trim() || processing}
        variant="accent"
        size="lg"
        className="w-full font-display font-semibold text-base"
      >
        {processing ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            {isExtracting ? "Extracting text..." : "Processing..."}
          </span>
        ) : (
          "Upload & Process Notes"
        )}
      </Button>
    </motion.div>
  );
};

export default UploadArea;
