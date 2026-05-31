# Project Brief: RAG 知识库系统

## Purpose

基于检索增强生成（RAG）的智能知识库问答系统。用户上传文档后，系统自动分割文本、生成向量索引，然后通过自然语言问答从知识库中检索相关内容并生成精准回答。

## Target Users

- 需要快速从大量文档中查找信息的用户
- 企业知识库管理
- 文档问答、客服等场景

## Core Use Case

1. 创建知识库
2. 上传文档（PDF、TXT、Markdown）
3. 系统自动分割文本并生成向量嵌入
4. 通过自然语言提问，AI 检索相关内容并生成回答
5. 查看回答来源片段

## Key Requirements

### Must Have

- 知识库管理（创建、删除）
- 文档上传（PDF、TXT、MD）
- 文本分割与向量化
- 语义相似度检索
- RAG 问答对话
- 暗色主题 UI

### Nice to Have

- OpenAI API Key 配置后获得 AI 增强回答
- 无 API Key 时回退到直接检索
- 对话历史保存

## Success Metrics

- 文档上传成功率 100%
- 无 TypeScript 错误
- 零 ESLint 错误

## Constraints

- 框架: Next.js 16 + React 19 + Tailwind CSS 4
- 数据库: SQLite (better-sqlite3 + Drizzle ORM)
- 包管理器: Bun
- 向量存储: SQLite BLOB 列（内存计算余弦相似度）
