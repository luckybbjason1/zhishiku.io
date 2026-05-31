import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";

export const knowledgeBases = sqliteTable("knowledge_bases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
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
