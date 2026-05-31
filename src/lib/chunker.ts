/**
 * Text chunking utilities for RAG pipeline
 */

export interface TextChunk {
  content: string;
  index: number;
}

/**
 * Split text into overlapping chunks by character count.
 */
export function chunkText(
  text: string,
  chunkSize = 800,
  overlap = 150
): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = start + chunkSize;

    // Try to break at a sentence or paragraph boundary
    if (end < normalized.length) {
      const breakPoints = ["\n\n", "\n", ". ", "! ", "? ", "; "];
      for (const bp of breakPoints) {
        const pos = normalized.lastIndexOf(bp, end);
        if (pos > start + chunkSize / 2) {
          end = pos + bp.length;
          break;
        }
      }
    } else {
      end = normalized.length;
    }

    const content = normalized.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({ content, index });
      index++;
    }

    start = end - overlap;
    if (start >= normalized.length) break;
  }

  return chunks;
}
