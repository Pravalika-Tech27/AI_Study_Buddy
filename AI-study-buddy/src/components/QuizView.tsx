import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView = ({ questions }: QuizViewProps) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) return null;

  const question = questions[currentQ];

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === question.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const restart = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="rounded-full gradient-primary p-4 mb-4">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">Quiz Complete!</h3>
        <p className="text-4xl font-display font-bold text-gradient mb-1">{percentage}%</p>
        <p className="text-muted-foreground mb-6">
          {score} out of {questions.length} correct
        </p>
        <Button variant="accent" onClick={restart}>Try Again</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Question {currentQ + 1} of {questions.length}
        </p>
        <p className="text-sm font-semibold text-secondary">
          Score: {score}/{currentQ + (answered ? 1 : 0)}
        </p>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="gradient-accent h-2 rounded-full transition-all duration-500"
          style={{ width: `${((currentQ + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <motion.div
        key={currentQ}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <h3 className="font-display text-lg font-semibold text-foreground">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            let optionClass = "bg-card border border-border hover:border-primary/40 hover:bg-muted/50";
            if (answered) {
              if (i === question.correctAnswer) {
                optionClass = "bg-emerald-50 border-2 border-emerald-500";
              } else if (i === selected && i !== question.correctAnswer) {
                optionClass = "bg-red-50 border-2 border-red-400";
              } else {
                optionClass = "bg-card border border-border opacity-50";
              }
            } else if (i === selected) {
              optionClass = "bg-primary/5 border-2 border-primary";
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left rounded-xl p-4 transition-all duration-200 flex items-center gap-3 ${optionClass}`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium text-foreground">{option}</span>
                {answered && i === question.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 ml-auto" />
                )}
                {answered && i === selected && i !== question.correctAnswer && (
                  <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button onClick={handleNext} variant="accent" className="w-full">
              {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizView;
