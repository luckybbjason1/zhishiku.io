import { NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";
import { retrieveChunks } from "@/lib/retrieval";
import { getDb } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

interface ChatRequest {
  knowledgeBaseId: string;
  conversationId?: string;
  message: string;
}

export async function POST(request: Request) {
  try {
    const { knowledgeBaseId, conversationId, message } =
      (await request.json()) as ChatRequest;

    if (!knowledgeBaseId || !message?.trim()) {
      return NextResponse.json(
        { error: "知识库ID和问题不能为空" },
        { status: 400 }
      );
    }

    const db = getDb();
    const now = new Date();

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      convId = randomUUID();
      await db.insert(conversations).values({
        id: convId,
        knowledgeBaseId,
        title: message.slice(0, 50),
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db
        .update(conversations)
        .set({ updatedAt: now })
        .where(eq(conversations.id, convId));
    }

    // Save user message
    await db.insert(messages).values({
      id: randomUUID(),
      conversationId: convId,
      role: "user",
      content: message,
      sources: null,
      createdAt: now,
    });

    // Embed query and retrieve relevant chunks
    const queryEmbedding = await embedText(message);
    const relevantChunks = await retrieveChunks(queryEmbedding, knowledgeBaseId, 5);

    // Build context from retrieved chunks
    const context = relevantChunks
      .filter((c) => c.score > 0.1)
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join("\n\n");

    // Build conversation history for context
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, convId))
      .orderBy(asc(messages.createdAt))
      .limit(20);

    const historyText = history
      .slice(-10) // last 10 messages
      .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
      .join("\n");

    // Generate answer using OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    let answer: string;

    if (apiKey && relevantChunks.length > 0) {
      const systemPrompt = `你是一个专业的知识库助手。请基于以下从知识库中检索到的相关内容来回答用户的问题。
回答要准确、详细，引用相关内容时请标注来源编号（如[1]、[2]等）。
如果检索到的内容无法回答问题，请诚实说明并提供你所知道的相关信息。

知识库相关内容：
${context}`;

      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-8).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ];

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          messages: chatMessages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("OpenAI API error:", errText);
        answer = buildFallbackAnswer(message, relevantChunks);
      } else {
        const data = (await res.json()) as {
          choices: { message: { content: string } }[];
        };
        answer = data.choices[0]?.message?.content ?? buildFallbackAnswer(message, relevantChunks);
      }
    } else {
      answer = buildFallbackAnswer(message, relevantChunks);
    }

    // Save assistant message
    const assistantMsgId = randomUUID();
    await db.insert(messages).values({
      id: assistantMsgId,
      conversationId: convId,
      role: "assistant",
      content: answer,
      sources: JSON.stringify(relevantChunks.map((c) => c.id)),
      createdAt: new Date(),
    });

    return NextResponse.json({
      conversationId: convId,
      answer,
      sources: relevantChunks.map((c) => ({
        id: c.id,
        content: c.content.slice(0, 200),
        score: c.score,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "对话失败，请重试" }, { status: 500 });
  }
}

function buildFallbackAnswer(
  query: string,
  chunks: { content: string; score: number }[]
): string {
  if (chunks.length === 0) {
    return `抱歉，在知识库中没有找到与"${query}"相关的内容。请确认知识库中已上传相关文档。`;
  }

  const relevant = chunks.filter((c) => c.score > 0.05);
  if (relevant.length === 0) {
    return `抱歉，在知识库中没有找到与您问题高度相关的内容。请尝试用不同的关键词提问。`;
  }

  const contextSnippets = relevant
    .slice(0, 3)
    .map((c, i) => `**[${i + 1}]** ${c.content.slice(0, 300)}...`)
    .join("\n\n");

  return `根据知识库中检索到的相关内容：\n\n${contextSnippets}\n\n> 注意：当前未配置 AI 模型（OPENAI_API_KEY），以上为从知识库中直接检索的相关片段。配置 API Key 后可获得更智能的回答。`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "缺少 conversationId" }, { status: 400 });
    }

    const db = getDb();
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(msgs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取消息失败" }, { status: 500 });
  }
}
