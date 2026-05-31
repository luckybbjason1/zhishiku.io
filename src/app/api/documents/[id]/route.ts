import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { documents, chunks, knowledgeBases } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    if (!doc) {
      return NextResponse.json({ error: "文档不存在" }, { status: 404 });
    }

    const chunkCount = doc.chunkCount;
    const kbId = doc.knowledgeBaseId;

    await db.delete(documents).where(eq(documents.id, id));

    // Update KB counts
    await db
      .update(knowledgeBases)
      .set({
        documentCount: sql`MAX(0, ${knowledgeBases.documentCount} - 1)`,
        chunkCount: sql`MAX(0, ${knowledgeBases.chunkCount} - ${chunkCount})`,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBases.id, kbId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "删除文档失败" }, { status: 500 });
  }
}
