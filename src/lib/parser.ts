/**
 * Document text extraction utilities
 */

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  if (mimeType === "application/pdf" || ext === "pdf") {
    return extractPdf(buffer);
  }

  // Plain text, markdown, etc.
  return buffer.toString("utf-8");
}

async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    // Use require to load pdf-parse (avoids ESM import issues in Next.js server routes)
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error("PDF parse error:", err);
    throw new Error("无法解析 PDF 文件，请确保文件未加密");
  }
}
