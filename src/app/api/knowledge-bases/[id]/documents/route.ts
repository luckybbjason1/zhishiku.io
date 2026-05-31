import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents, chunks, knowledgeBases } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { extractText } from "@/lib/parser";
import { chunkText } from "@/lib/chunker";
import { embedBatch, float32ArrayToBuffer } from "@/lib/embeddings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const docs = await db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        size: documents.size,
        status: documents.status,
        chunkCount: documents.chunkCount,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.knowledgeBaseId, id))
      .orderBy(desc(documents.createdAt));

    return NextResponse.json(docs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取文档列表失败" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: knowledgeBaseId } = await params;
    const db = getDb();

    // Verify KB exists
    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, knowledgeBaseId));
    if (!kb) {
      return NextResponse.json({ error: "知识库不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "text/x-markdown",
    ];
    const allowedExts = ["pdf", "txt", "md", "markdown"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      return NextResponse.json(
        { error: "只支持 PDF、TXT、MD 格式" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const docId = randomUUID();
    const now = new Date();

    // Extract text
    const rawText = await extractText(buffer, file.type, file.name);

    // Insert document (processing state)
    await db.insert(documents).values({
      id: docId,
      knowledgeBaseId,
      name: file.name,
      type: ext,
      size: file.size,
      content: rawText,
      status: "processing",
      chunkCount: 0,
      createdAt: now,
    });

    // Chunk the text
    const textChunks = chunkText(rawText);

    // Embed all chunks
    const embeddings = await embedBatch(textChunks.map((c) => c.content));

    // Insert chunks
    const chunkRecords = textChunks.map((c, i) => ({
      id: randomUUID(),
      documentId: docId,
      knowledgeBaseId,
      content: c.content,
      embedding: float32ArrayToBuffer(embeddings[i]),
      chunkIndex: c.index,
      createdAt: now,
    }));

    if (chunkRecords.length > 0) {
      await db.insert(chunks).values(chunkRecords);
    }

    // Update document status and chunk count
    await db
      .update(documents)
      .set({ status: "ready", chunkCount: chunkRecords.length })
      .where(eq(documents.id, docId));

    // Update KB counts
    await db
      .update(knowledgeBases)
      .set({
        documentCount: sql`${knowledgeBases.documentCount} + 1`,
        chunkCount: sql`${knowledgeBases.chunkCount} + ${chunkRecords.length}`,
        updatedAt: now,
      })
      .where(eq(knowledgeBases.id, knowledgeBaseId));

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId));

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "上传文档失败" }, { status: 500 });
  }
}
