# Active Context: RAG 知识库系统

## Current State

**Project Status**: ✅ RAG 知识库系统已完整实现

完整的检索增强生成（RAG）知识库问答系统，支持文档上传、向量化索引和智能问答。

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] **RAG 知识库系统完整实现**
  - SQLite 数据库 (better-sqlite3 + Drizzle ORM)
  - 文档上传 API (PDF/TXT/MD 支持)
  - 文本分割器 (chunkText, 800字符窗口/150字符重叠)
  - 向量嵌入 (OpenAI text-embedding-3-small，无 API Key 时回退到哈希向量)
  - 余弦相似度检索
  - RAG 对话 API (OpenAI GPT-4o-mini，无 API Key 时显示原始片段)
  - 完整 React UI (暗色主题，知识库管理+文档上传+智能问答)

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | 主页面 (RAGApp 入口) | ✅ Ready |
| `src/app/layout.tsx` | Root layout | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/api/knowledge-bases/` | 知识库 CRUD API | ✅ Ready |
| `src/app/api/knowledge-bases/[id]/documents/` | 文档上传 API | ✅ Ready |
| `src/app/api/documents/[id]/` | 文档删除 API | ✅ Ready |
| `src/app/api/chat/` | RAG 问答 API | ✅ Ready |
| `src/app/api/conversations/[id]/` | 对话删除 API | ✅ Ready |
| `src/db/schema.ts` | Drizzle 数据库 Schema | ✅ Ready |
| `src/db/index.ts` | DB 初始化 | ✅ Ready |
| `src/lib/chunker.ts` | 文本分割 | ✅ Ready |
| `src/lib/embeddings.ts` | 向量嵌入 + 余弦相似度 | ✅ Ready |
| `src/lib/parser.ts` | PDF/TXT/MD 文本提取 | ✅ Ready |
| `src/lib/retrieval.ts` | 向量检索 | ✅ Ready |
| `src/components/rag/RAGApp.tsx` | 主应用 UI | ✅ Ready |
| `src/components/rag/ChatInterface.tsx` | 问答界面 | ✅ Ready |
| `src/components/rag/DocumentUpload.tsx` | 文档上传界面 | ✅ Ready |
| `src/components/rag/KnowledgeBaseCard.tsx` | 知识库卡片 | ✅ Ready |
| `src/components/rag/CreateKnowledgeBaseModal.tsx` | 新建知识库弹窗 | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Tech Stack Additions

- `better-sqlite3` + `drizzle-orm` - SQLite 数据库
- `pdf-parse` - PDF 文本提取
- `lucide-react` - 图标库
- `ai` + `@ai-sdk/openai` - AI SDK (备用)

## Environment Variables

| 变量 | 用途 | 必需 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API Key（嵌入 + 问答） | 否（有回退方案） |
| `OPENAI_MODEL` | 模型名称，默认 `gpt-4o-mini` | 否 |

## Current Focus

系统已完整实现。无需 API Key 即可使用（回退到哈希向量检索+原始片段展示）。

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-05-31 | 完整 RAG 知识库系统实现 |
