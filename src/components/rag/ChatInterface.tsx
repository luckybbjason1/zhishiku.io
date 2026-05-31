"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ChevronDown, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; content: string; score: number }[];
}

interface Props {
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}

export function ChatInterface({ knowledgeBaseId, knowledgeBaseName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSources, setShowSources] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledgeBaseId,
          conversationId,
          message: userMsg,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error);
      }

      const data = await res.json() as {
        conversationId: string;
        answer: string;
        sources: { id: string; content: string; score: number }[];
      };

      setConversationId(data.conversationId);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `抱歉，发生了错误：${err instanceof Error ? err.message : "未知错误"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([]);
    setConversationId(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-900/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-100">RAG 智能问答</p>
            <p className="text-xs text-neutral-500">{knowledgeBaseName}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-neutral-500">
            清空对话
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-indigo-900/30 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-200 mb-2">
              开始提问
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm">
              基于「{knowledgeBaseName}」知识库回答问题。上传文档后，AI 将从中检索相关内容为您解答。
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              {[
                "这份文档的主要内容是什么？",
                "请总结文档中的关键信息",
                "有哪些重要概念需要了解？",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-left text-sm text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg px-3.5 py-2 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-indigo-600"
                    : "bg-neutral-800"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-neutral-300" />
                )}
              </div>
              <div className={`flex-1 space-y-2 ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Sources */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="w-full max-w-[85%]">
                    <button
                      onClick={() =>
                        setShowSources(showSources === msg.id ? null : msg.id)
                      }
                      className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
                    >
                      <BookOpen className="h-3 w-3" />
                      {msg.sources.length} 个引用来源
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${
                          showSources === msg.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showSources === msg.id && (
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((src, i) => (
                          <div
                            key={src.id}
                            className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-indigo-400">
                                来源 {i + 1}
                              </span>
                              <span className="text-xs text-neutral-600">
                                相似度 {(src.score * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 line-clamp-3">
                              {src.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-neutral-300" />
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-neutral-600 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-neutral-600 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-neutral-600 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-neutral-800">
        <div className="flex items-end gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 focus-within:border-indigo-500 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题... (Enter 发送，Shift+Enter 换行)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none max-h-32"
            style={{ minHeight: "20px" }}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 h-8 w-8 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-center text-neutral-600">
          AI 回答基于知识库内容生成，请核实重要信息
        </p>
      </div>
    </div>
  );
}
