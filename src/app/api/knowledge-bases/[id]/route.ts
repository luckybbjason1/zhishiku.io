import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { knowledgeBases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const [kb] = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, id));

    if (!kb) {
      return NextResponse.json({ error: "知识库不存在" }, { status: 404 });
    }
    return NextResponse.json(kb);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "获取知识库失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "删除知识库失败" }, { status: 500 });
  }
}
