/**
 * Vector similarity retrieval for RAG
 */
import { getDb } from "@/db";
import { chunks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cosineSimilarity, bufferToFloat32Array } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  score: number;
}

/**
 * Retrieve top-k most similar chunks from a knowledge base
 */
export async function retrieveChunks(
  queryEmbedding: Float32Array,
  knowledgeBaseId: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  const db = getDb();

  const allChunks = await db
    .select({
      id: chunks.id,
      content: chunks.content,
      documentId: chunks.documentId,
      embedding: chunks.embedding,
    })
    .from(chunks)
    .where(eq(chunks.knowledgeBaseId, knowledgeBaseId));

  const scored = allChunks
    .filter((c) => c.embedding !== null)
    .map((c) => {
      const embBuf = c.embedding as Buffer;
      const emb = bufferToFloat32Array(embBuf);
      const score = cosineSimilarity(queryEmbedding, emb);
      return {
        id: c.id,
        content: c.content,
        documentId: c.documentId,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}
