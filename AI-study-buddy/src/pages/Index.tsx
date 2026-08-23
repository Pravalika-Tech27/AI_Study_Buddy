import { useState, useCallback } from "react";
import AppSidebar from "@/components/AppSidebar";
import UploadArea from "@/components/UploadArea";
import SummaryView from "@/components/SummaryView";
import FlashcardView, { type Flashcard } from "@/components/FlashcardView";
import QuizView, { type QuizQuestion } from "@/components/QuizView";
import ChatInterface from "@/components/ChatInterface";
import { generateSummary, generateFlashcards, generateQuiz, askQuestion } from "@/lib/ai-service";
import { motion } from "framer-motion";
import { FileText, BookOpen, Brain, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import aiBg from "@/assets/ai-bg.jpg";

type Tab = "upload" | "summary" | "flashcards" | "quiz" | "chat";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [noteText, setNoteText] = useState("");
  const [noteName, setNoteName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [summary, setSummary] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const hasContent = noteText.length > 0;

  const handleUpload = useCallback(async (text: string, fileName: string) => {
    setIsProcessing(true);
    setNoteText(text);
    setNoteName(fileName);
    // Reset generated content
    setSummary("");
    setFlashcards([]);
    setQuizQuestions([]);
    await new Promise((r) => setTimeout(r, 800));
    setIsProcessing(false);
    toast.success("Notes uploaded! Select a study tool to get started.");
    setActiveTab("summary");
  }, []);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSummary(noteText);
      setSummary(result);
    } catch { toast.error("Failed to generate summary"); }
    setIsGenerating(false);
  };

  const handleGenerateFlashcards = async () => {
    setIsGenerating(true);
    try {
      const result = await generateFlashcards(noteText);
      setFlashcards(result);
    } catch { toast.error("Failed to generate flashcards"); }
    setIsGenerating(false);
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const result = await generateQuiz(noteText);
      setQuizQuestions(result);
    } catch { toast.error("Failed to generate quiz"); }
    setIsGenerating(false);
  };

  const handleAsk = async (question: string) => {
    setIsChatLoading(true);
    try {
      const answer = await askQuestion(noteText, question);
      setIsChatLoading(false);
      return answer;
    } catch {
      setIsChatLoading(false);
      throw new Error("Failed");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "upload":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-foreground mb-2">
                Upload Study Material
              </h2>
              <p className="text-muted-foreground">
                Add your notes, and AI will help you study smarter.
              </p>
            </div>
            <UploadArea onTextSubmit={handleUpload} isProcessing={isProcessing} />
          </div>
        );

      case "summary":
        return (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Summary</h2>
                <p className="text-sm text-muted-foreground">{noteName}</p>
              </div>
              {!summary && (
                <Button onClick={handleGenerateSummary} variant="accent" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Summary
                </Button>
              )}
            </div>
            {summary ? (
              <SummaryView summary={summary} />
            ) : !isGenerating ? (
              <EmptyState icon={FileText} text="Click 'Generate Summary' to create an AI summary of your notes." />
            ) : (
              <LoadingState text="Generating summary..." />
            )}
          </div>
        );

      case "flashcards":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Flashcards</h2>
                <p className="text-sm text-muted-foreground">{noteName}</p>
              </div>
              {flashcards.length === 0 && (
                <Button onClick={handleGenerateFlashcards} variant="accent" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Flashcards
                </Button>
              )}
            </div>
            {flashcards.length > 0 ? (
              <FlashcardView flashcards={flashcards} />
            ) : !isGenerating ? (
              <EmptyState icon={BookOpen} text="Click 'Generate Flashcards' to create study cards from your notes." />
            ) : (
              <LoadingState text="Creating flashcards..." />
            )}
          </div>
        );

      case "quiz":
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Quiz</h2>
                <p className="text-sm text-muted-foreground">{noteName}</p>
              </div>
              {quizQuestions.length === 0 && (
                <Button onClick={handleGenerateQuiz} variant="accent" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Quiz
                </Button>
              )}
            </div>
            {quizQuestions.length > 0 ? (
              <QuizView questions={quizQuestions} />
            ) : !isGenerating ? (
              <EmptyState icon={Brain} text="Click 'Generate Quiz' to test your knowledge with multiple choice questions." />
            ) : (
              <LoadingState text="Creating quiz questions..." />
            )}
          </div>
        );

      case "chat":
        return (
          <div className="max-w-3xl mx-auto">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-bold text-foreground">Ask AI</h2>
              <p className="text-sm text-muted-foreground">Ask questions about your notes</p>
            </div>
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <ChatInterface onAsk={handleAsk} isLoading={isChatLoading} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* AI Background Image */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url(${aiBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} hasContent={hasContent} />
      <main className="flex-1 p-8 overflow-y-auto relative z-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </main>
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="rounded-full bg-muted p-4 mb-4">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <p className="text-muted-foreground max-w-sm">{text}</p>
  </div>
);

const LoadingState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="h-8 w-8 text-secondary animate-spin mb-4" />
    <p className="text-muted-foreground">{text}</p>
  </div>
);

export default Index;
