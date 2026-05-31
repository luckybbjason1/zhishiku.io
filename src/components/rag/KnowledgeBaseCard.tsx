"use client";

import { MessageSquare, FileText, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_TYPE_LABELS, AI_TYPE_COLORS, type AIType } from "@/db/schema";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  aiType: string;
  documentCount: number;
  chunkCount: number;
  createdAt: Date | string | number;
}

interface Props {
  kb: KnowledgeBase;
  onSelect: (kb: KnowledgeBase) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
}

const AI_TYPE_ICONS: Record<AIType, string> = {
  chatgpt: "🤖",
  claude: "🧡",
  gemini: "💎",
  llama: "🦙",
  qwen: "☁️",
  deepseek: "🔬",
  general: "📚",
};

export function KnowledgeBaseCard({ kb, onSelect, onDelete, isSelected }: Props) {
  const createdAt = new Date(kb.createdAt);
  const aiType = (kb.aiType ?? "general") as AIType;
  const colorClass = AI_TYPE_COLORS[aiType] ?? AI_TYPE_COLORS.general;
  const label = AI_TYPE_LABELS[aiType] ?? "通用";
  const icon = AI_TYPE_ICONS[aiType] ?? "📚";

  return (
    <div
      className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-150 ${
        isSelected
          ? "border-indigo-500 bg-indigo-950/30"
          : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900"
      }`}
      onClick={() => onSelect(kb)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <h3 className="font-medium text-neutral-100 truncate">{kb.name}</h3>
          </div>
          {/* AI type badge */}
          <div className="mt-1.5 ml-10">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
            >
              <span>{icon}</span>
              {label}
            </span>
          </div>
          {kb.description && (
            <p className="mt-1 ml-10 text-xs text-neutral-500 line-clamp-2">
              {kb.description}
            </p>
          )}
          <div className="mt-2 ml-10 flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {kb.documentCount} 个文档
            </span>
            <span>{kb.chunkCount} 个片段</span>
            <span>{createdAt.toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 hover:bg-red-900/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(kb.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isSelected ? "rotate-90 text-indigo-400" : "text-neutral-600"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
