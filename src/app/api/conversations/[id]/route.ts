import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    await db.delete(conversations).where(eq(conversations.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "删除对话失败" }, { status: 500 });
  }
}
