import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { knowledgeBases, AI_TYPES, type AIType } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const db = getDb();
    const kbs = await db
      .select()
      .from(knowledgeBases)
      .orderBy(desc(knowledgeBases.createdAt));
    return NextResponse.json(kbs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取知识库失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, aiType } = await request.json() as {
      name: string;
      description?: string;
      aiType?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "知识库名称不能为空" }, { status: 400 });
    }

    const resolvedAiType: AIType =
      aiType && (AI_TYPES as readonly string[]).includes(aiType)
        ? (aiType as AIType)
        : "general";

    const db = getDb();
    const now = new Date();
    const id = randomUUID();

    await db.insert(knowledgeBases).values({
      id,
      name: name.trim(),
      description: description?.trim() ?? null,
      aiType: resolvedAiType,
      createdAt: now,
      updatedAt: now,
      documentCount: 0,
      chunkCount: 0,
    });

    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, id));

    return NextResponse.json(kb, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "创建知识库失败" }, { status: 500 });
  }
}
