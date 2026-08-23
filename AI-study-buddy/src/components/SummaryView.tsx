import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface SummaryViewProps {
  summary: string;
}

const SummaryView = ({ summary }: SummaryViewProps) => {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-6 shadow-card"
    >
      <div className="prose prose-sm max-w-none text-foreground">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </motion.div>
  );
};

export default SummaryView;
