import { BookOpen, FileText, Brain, MessageSquare, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "upload" | "summary" | "flashcards" | "quiz" | "chat";

interface AppSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  hasContent: boolean;
}

const tabs = [
  { id: "upload" as Tab, label: "Upload", icon: Upload },
  { id: "summary" as Tab, label: "Summary", icon: FileText },
  { id: "flashcards" as Tab, label: "Flashcards", icon: BookOpen },
  { id: "quiz" as Tab, label: "Quiz", icon: Brain },
  { id: "chat" as Tab, label: "Ask AI", icon: MessageSquare },
];

const AppSidebar = ({ activeTab, onTabChange, hasContent }: AppSidebarProps) => {
  return (
    <aside className="w-64 gradient-primary min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 px-3 py-4 mb-6">
        <Sparkles className="h-6 w-6 text-accent" />
        <h1 className="font-display text-xl font-bold text-sidebar-foreground">Study Buddy</h1>
      </div>

      <nav className="space-y-1 flex-1">
        {tabs.map((tab) => {
          const disabled = tab.id !== "upload" && !hasContent;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && onTabChange(tab.id)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : disabled
                  ? "text-sidebar-foreground/30 cursor-not-allowed"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 text-xs text-sidebar-foreground/40">
        Powered by AI
      </div>
    </aside>
  );
};

export default AppSidebar;
