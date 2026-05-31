import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

export const AI_TYPES = [
  "chatgpt",
  "claude",
  "gemini",
  "llama",
  "qwen",
  "deepseek",
  "general",
] as const;

export type AIType = (typeof AI_TYPES)[number];

export const AI_TYPE_LABELS: Record<AIType, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  llama: "Llama",
  qwen: "通义千问",
  deepseek: "DeepSeek",
  general: "通用",
};

export const AI_TYPE_COLORS: Record<AIType, string> = {
  chatgpt: "bg-green-900/40 text-green-400 border-green-800",
  claude: "bg-orange-900/40 text-orange-400 border-orange-800",
  gemini: "bg-blue-900/40 text-blue-400 border-blue-800",
  llama: "bg-purple-900/40 text-purple-400 border-purple-800",
  qwen: "bg-sky-900/40 text-sky-400 border-sky-800",
  deepseek: "bg-cyan-900/40 text-cyan-400 border-cyan-800",
  general: "bg-neutral-800/60 text-neutral-400 border-neutral-700",
};

export const knowledgeBases = sqliteTable("knowledge_bases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  aiType: text("ai_type").notNull().default("general"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  documentCount: integer("document_count").notNull().default(0),
  chunkCount: integer("chunk_count").notNull().default(0),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => knowledgeBases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // pdf, txt, md
  size: integer("size").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("processing"), // processing, ready, error
  chunkCount: integer("chunk_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const chunks = sqliteTable("chunks", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => knowledgeBases.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  embedding: blob("embedding", { mode: "buffer" }), // stored as Float32Array buffer
  chunkIndex: integer("chunk_index").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => knowledgeBases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user | assistant
  content: text("content").notNull(),
  sources: text("sources"), // JSON array of chunk IDs used
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Chunk = typeof chunks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
