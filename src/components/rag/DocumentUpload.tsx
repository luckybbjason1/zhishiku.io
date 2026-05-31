"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  status: string;
  chunkCount: number;
  createdAt: string | Date | number;
}

interface Props {
  knowledgeBaseId: string;
  documents: Document[];
  onDocumentsChange: () => void;
}

export function DocumentUpload({ knowledgeBaseId, documents, onDocumentsChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error);
      }
      onDocumentsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(docId: string) {
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      onDocumentsChange();
    } catch {
      setError("删除文档失败");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all duration-150 ${
          dragOver
            ? "border-indigo-500 bg-indigo-950/20"
            : "border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <>
            <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm text-neutral-300 font-medium">正在处理文档...</p>
            <p className="text-xs text-neutral-500 mt-1">分割文本并生成向量中</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-neutral-500 mb-3" />
            <p className="text-sm text-neutral-300 font-medium">点击或拖放文件到此处</p>
            <p className="text-xs text-neutral-500 mt-1">支持 PDF、TXT、Markdown 格式</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            已上传文档 ({documents.length})
          </p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3.5 py-2.5"
            >
              <div className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 truncate font-medium">{doc.name}</p>
                <p className="text-xs text-neutral-500">
                  {formatSize(doc.size)} · {doc.chunkCount} 片段
                </p>
              </div>
              <div className="flex items-center gap-2">
                {doc.status === "ready" ? (
                  <Badge variant="success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    就绪
                  </Badge>
                ) : doc.status === "error" ? (
                  <Badge variant="error">
                    <XCircle className="h-3 w-3 mr-1" />
                    错误
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    处理中
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                  onClick={() => deleteDocument(doc.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
