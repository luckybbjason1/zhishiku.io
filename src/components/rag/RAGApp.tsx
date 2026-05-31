"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Database, ChevronLeft, Upload as UploadIcon, MessageSquare, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeBaseCard } from "./KnowledgeBaseCard";
import { CreateKnowledgeBaseModal } from "./CreateKnowledgeBaseModal";
import { DocumentUpload } from "./DocumentUpload";
import { ChatInterface } from "./ChatInterface";
import { AI_TYPES, AI_TYPE_LABELS, AI_TYPE_COLORS, type AIType } from "@/db/schema";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  aiType: string;
  documentCount: number;
  chunkCount: number;
  createdAt: Date | string | number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  chunkCount: number;
  createdAt: string | Date | number;
}

type ActiveView = "documents" | "chat";

const AI_TYPE_ICONS: Record<AIType, string> = {
  chatgpt: "🤖",
  claude: "🧡",
  gemini: "💎",
  llama: "🦙",
  qwen: "☁️",
  deepseek: "🔬",
  general: "📚",
};

export function RAGApp() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("documents");
  const [loading, setLoading] = useState(true);
  const [filterAiType, setFilterAiType] = useState<AIType | "all">("all");

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-bases");
      const data = await res.json();
      setKnowledgeBases(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        console.error("知识库 API 返回异常:", data);
      }
    } catch (err) {
      console.error(err);
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (kbId: string) => {
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}/documents`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setDocuments([]);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  useEffect(() => {
    if (selectedKb) {
      fetchDocuments(selectedKb.id);
    }
  }, [selectedKb, fetchDocuments]);

  async function handleDeleteKb(id: string) {
    if (!confirm("确定要删除这个知识库吗？所有文档和对话将被永久删除。")) return;
    await fetch(`/api/knowledge-bases/${id}`, { method: "DELETE" });
    if (selectedKb?.id === id) setSelectedKb(null);
    fetchKnowledgeBases();
  }

  function handleKbCreated(kb: KnowledgeBase) {
    setShowCreateModal(false);
    fetchKnowledgeBases();
    setSelectedKb(kb);
    setActiveView("documents");
    // Auto-select the AI category filter to match the created KB
    if (kb.aiType) {
      setFilterAiType(kb.aiType as AIType);
    }
  }

  function handleDocumentsChange() {
    if (selectedKb) {
      fetchDocuments(selectedKb.id);
      // Refresh KB list to update counts
      fetchKnowledgeBases().then(() => {
        // Update the selected KB with fresh data
        setKnowledgeBases((prev) => {
          const updated = prev.find((kb) => kb.id === selectedKb.id);
          if (updated) setSelectedKb(updated);
          return prev;
        });
      });
    }
  }

  // Compute which AI types are present in the knowledge bases
  const presentAiTypes = useMemo(() => {
    const types = new Set(knowledgeBases.map((kb) => kb.aiType as AIType));
    return AI_TYPES.filter((t) => types.has(t));
  }, [knowledgeBases]);

  const filteredKbs = useMemo(() => {
    if (filterAiType === "all") return knowledgeBases;
    return knowledgeBases.filter((kb) => kb.aiType === filterAiType);
  }, [knowledgeBases, filterAiType]);

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-neutral-800 bg-neutral-950">
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-neutral-100">RAG 知识库</h1>
                <p className="text-xs text-neutral-500">智能问答系统</p>
              </div>
            </div>
          </div>
        </div>

        {/* New KB button */}
        <div className="px-4 py-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full justify-start gap-2"
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            新建知识库
          </Button>
        </div>

        {/* AI Category filter tabs */}
        {!loading && knowledgeBases.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1 mb-2">
              <Filter className="h-3 w-3 text-neutral-500" />
              <span className="text-xs text-neutral-500">按 AI 分类筛选</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterAiType("all")}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                  filterAiType === "all"
                    ? "border-indigo-500 bg-indigo-950/60 text-indigo-300"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
                }`}
              >
                全部 ({knowledgeBases.length})
              </button>
              {presentAiTypes.map((type) => {
                const count = knowledgeBases.filter((kb) => kb.aiType === type).length;
                return (
                  <button
                    key={type}
                    onClick={() => setFilterAiType(type)}
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all ${
                      filterAiType === type
                        ? `${AI_TYPE_COLORS[type]} ring-1 ring-inset ring-current`
                        : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
                    }`}
                  >
                    <span>{AI_TYPE_ICONS[type]}</span>
                    {AI_TYPE_LABELS[type]}
                    <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Knowledge base list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : filteredKbs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-10 w-10 text-neutral-700 mb-3" />
              {knowledgeBases.length === 0 ? (
                <>
                  <p className="text-sm text-neutral-500">还没有知识库</p>
                  <p className="text-xs text-neutral-600 mt-1">点击上方按钮新建</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-neutral-500">该分类下暂无知识库</p>
                  <button
                    className="text-xs text-indigo-400 mt-1 hover:text-indigo-300"
                    onClick={() => setFilterAiType("all")}
                  >
                    查看全部
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredKbs.map((kb) => (
              <KnowledgeBaseCard
                key={kb.id}
                kb={kb}
                onSelect={(k) => {
                  setSelectedKb(k);
                  setActiveView("documents");
                }}
                onDelete={handleDeleteKb}
                isSelected={selectedKb?.id === kb.id}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-800">
          <p className="text-xs text-neutral-600 text-center">
            {filteredKbs.length === knowledgeBases.length
              ? `${knowledgeBases.length} 个知识库 · RAG 系统`
              : `显示 ${filteredKbs.length} / ${knowledgeBases.length} 个知识库`}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedKb ? (
          <>
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedKb(null)}
                  className="text-neutral-500"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-neutral-100">{selectedKb.name}</h2>
                    {selectedKb.aiType && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium ${
                          AI_TYPE_COLORS[selectedKb.aiType as AIType] ?? AI_TYPE_COLORS.general
                        }`}
                      >
                        <span>{AI_TYPE_ICONS[selectedKb.aiType as AIType] ?? "📚"}</span>
                        {AI_TYPE_LABELS[selectedKb.aiType as AIType] ?? "通用"}
                      </span>
                    )}
                  </div>
                  {selectedKb.description && (
                    <p className="text-xs text-neutral-500">{selectedKb.description}</p>
                  )}
                </div>
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1">
                <button
                  onClick={() => setActiveView("documents")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeView === "documents"
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  <UploadIcon className="h-3.5 w-3.5" />
                  文档管理
                </button>
                <button
                  onClick={() => setActiveView("chat")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeView === "chat"
                      ? "bg-neutral-800 text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-400"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  智能问答
                </button>
              </div>
            </div>

            {/* View content */}
            <div className="flex-1 overflow-hidden">
              {activeView === "documents" ? (
                <div className="h-full overflow-y-auto p-6">
                  <div className="max-w-2xl">
                    <div className="mb-5">
                      <h3 className="text-base font-semibold text-neutral-100 mb-1">
                        文档管理
                      </h3>
                      <p className="text-sm text-neutral-500">
                        上传文档到知识库，系统将自动处理并建立向量索引
                      </p>
                    </div>
                    <DocumentUpload
                      knowledgeBaseId={selectedKb.id}
                      documents={documents}
                      onDocumentsChange={handleDocumentsChange}
                    />
                  </div>
                </div>
              ) : (
                <ChatInterface
                  knowledgeBaseId={selectedKb.id}
                  knowledgeBaseName={selectedKb.name}
                />
              )}
            </div>
          </>
        ) : (
          /* Welcome screen */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <div className="h-20 w-20 rounded-2xl bg-indigo-900/30 flex items-center justify-center mx-auto mb-6">
                <Database className="h-10 w-10 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-100 mb-3">
                RAG 知识库系统
              </h2>
              <p className="text-neutral-500 leading-relaxed mb-6">
                上传您的文档（PDF、TXT、Markdown），系统将自动分割文本、生成向量索引，然后您可以通过自然语言提问，AI 将基于您的知识库内容给出精准回答。
              </p>
              {/* AI category showcase */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {AI_TYPES.map((type) => (
                  <div
                    key={type}
                    className={`rounded-xl border px-2 py-2.5 flex flex-col items-center gap-1 ${AI_TYPE_COLORS[type]}`}
                  >
                    <span className="text-lg">{AI_TYPE_ICONS[type]}</span>
                    <span className="text-xs font-medium">{AI_TYPE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: "📄", title: "上传文档", desc: "PDF / TXT / MD" },
                  { icon: "🔍", title: "向量检索", desc: "语义相似度搜索" },
                  { icon: "💬", title: "智能问答", desc: "基于内容生成回答" },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="text-sm font-medium text-neutral-200">{item.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                新建知识库
              </Button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateKnowledgeBaseModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(kb) => handleKbCreated(kb as KnowledgeBase)}
        />
      )}
    </div>
  );
}
