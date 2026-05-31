/**
 * Embedding utilities using OpenAI text-embedding-3-small
 * Falls back to a simple TF-IDF-like vector when no API key is set
 */

const EMBEDDING_DIM = 1536;

export async function embedText(text: string): Promise<Float32Array> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackEmbed(text);
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 8192),
    }),
  });

  if (!res.ok) {
    console.error("Embedding API error:", await res.text());
    return fallbackEmbed(text);
  }

  const data = await res.json() as { data: { embedding: number[] }[] };
  return new Float32Array(data.data[0].embedding);
}

export async function embedBatch(texts: string[]): Promise<Float32Array[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return texts.map(fallbackEmbed);
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts.map((t) => t.slice(0, 8192)),
    }),
  });

  if (!res.ok) {
    console.error("Embedding batch API error:", await res.text());
    return texts.map(fallbackEmbed);
  }

  const data = await res.json() as { data: { embedding: number[]; index: number }[] };
  const sorted = data.data.sort((a, b) => a.index - b.index);
  return sorted.map((d) => new Float32Array(d.embedding));
}

/**
 * Simple deterministic hash-based fallback embedding (no API key required)
 * Uses character n-gram frequency hashing projected to EMBEDDING_DIM dimensions
 */
function fallbackEmbed(text: string): Float32Array {
  const vec = new Float32Array(EMBEDDING_DIM);
  const lower = text.toLowerCase();

  // Character trigrams
  for (let i = 0; i < lower.length - 2; i++) {
    const gram = lower.slice(i, i + 3);
    let hash = 0;
    for (let j = 0; j < gram.length; j++) {
      hash = (hash * 31 + gram.charCodeAt(j)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 1;
  }

  // Word unigrams
  const words = lower.split(/\s+/);
  for (const word of words) {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 37 + word.charCodeAt(j)) >>> 0;
    }
    const idx = hash % EMBEDDING_DIM;
    vec[idx] += 2;
  }

  // Normalize
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < EMBEDDING_DIM; i++) vec[i] /= norm;

  return vec;
}

/**
 * Cosine similarity between two Float32Arrays
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function float32ArrayToBuffer(arr: Float32Array): Buffer {
  return Buffer.from(arr.buffer);
}

export function bufferToFloat32Array(buf: Buffer): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
