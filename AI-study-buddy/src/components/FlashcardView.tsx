import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardViewProps {
  flashcards: Flashcard[];
}

const FlashcardView = ({ flashcards }: FlashcardViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex];

  const next = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i + 1) % flashcards.length);
  };

  const prev = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
        <Button variant="ghost" size="sm" onClick={() => setIsFlipped(false)}>
          <RotateCcw className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>

      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${isFlipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`min-h-[250px] rounded-xl p-8 flex flex-col items-center justify-center text-center ${
              isFlipped
                ? "gradient-accent text-accent-foreground"
                : "bg-card border border-border shadow-elevated"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wider mb-4 opacity-70">
              {isFlipped ? "Answer" : "Question"}
            </p>
            <p className={`font-display text-xl font-semibold leading-relaxed ${
              isFlipped ? "" : "text-foreground"
            }`}>
              {isFlipped ? card.answer : card.question}
            </p>
            <p className="mt-6 text-xs opacity-60">
              Click to {isFlipped ? "see question" : "reveal answer"}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {flashcards.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-secondary" : "bg-border"
              }`}
            />
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={next}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FlashcardView;
