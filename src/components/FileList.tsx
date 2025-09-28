"use client";

import { FileItem } from "@/lib/r2";

import {
  File,
  Image,
  FileText,
  Video,
  Download,
  Trash2,
  Eye,
  Folder,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FileListProps {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  onFileDelete?: (key: string) => void;
  formatFileSize?: (bytes: number) => string;
  onDragStart?: (file: FileItem) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetFolder?: string) => void;
  onDragEnd?: () => void;
  draggedItem?: FileItem | null;
}

export function FileList({
  files,
  onFileClick,
  onFileDelete,
  formatFileSize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedItem,
}: FileListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const getFileIcon = (fileName: string, isFolder?: boolean) => {
    if (isFolder) {
      return <Folder className="w-5 h-5 text-yellow-500" />;
    }

    const extension = fileName.toLowerCase().split(".").pop();

    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension || "")) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (
      ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension || "")
    ) {
      return <Video className="w-5 h-5 text-purple-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleDownload = async (key: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(key)}`);
      const data = await response.json();

      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("다운로드 중 오류:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="divide-y divide-gray-200">
      {files.map((file) => {
        const isDragging = draggedItem?.key === file.key;
        const isDropTarget =
          file.isFolder && draggedItem && draggedItem.key !== file.key;

        return (
          <div
            key={file.key}
            className={`flex items-center justify-between p-4 transition-colors ${
              isDragging
                ? "opacity-50 bg-blue-50"
                : isDropTarget
                ? "bg-blue-50 border-2 border-blue-300 border-dashed"
                : "hover:bg-gray-50"
            }`}
            draggable
            onDragStart={() => onDragStart?.(file)}
            onDragOver={onDragOver}
            onDrop={(e) =>
              onDrop?.(e, file.isFolder ? file.fileName : undefined)
            }
            onDragEnd={onDragEnd}
          >
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => {
                if (file.isFolder) {
                  const querySearchParams = new URLSearchParams(searchParams);
                  querySearchParams.set("path", file.fileName);
                  router.push(`${pathname}?${querySearchParams.toString()}`);
                }
              }}
            >
              {getFileIcon(file.fileName, file.isFolder)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.fileName}
                </p>
                <p className="text-xs text-gray-500">{file.key}</p>
                <p className="text-xs text-gray-500">
                  {file.isFolder ? "폴더" : formatFileSize?.(file.size)}
                  {file.lastModified
                    ? formatDate(file.lastModified.toISOString())
                    : null}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {file.isPreviewable && !file.isFolder && (
                <button
                  onClick={() => onFileClick?.(file)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="미리보기"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {!file.isFolder && (
                <button
                  onClick={() => handleDownload?.(file.key, file.fileName)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="다운로드"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onFileDelete?.(file.key)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
