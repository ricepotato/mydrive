"use client";

import { moveFileAction } from "@/actions/actions";
import { FileItem } from "@/lib/r2";
import { useState } from "react";

import {
  Download,
  Eye,
  File,
  FileText,
  Folder,
  Image,
  Trash2,
  Video,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FileListView({ files }: { files: FileItem[] }) {
  const [draggedItem, setDraggedItem] = useState<FileItem | undefined>();

  const handleDragStart = (file: FileItem) => {
    console.log(`handleDragStart ${file}`);
    setDraggedItem(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    console.log(`handleDragOver ${e}`);
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetFolder?: string) => {
    e.preventDefault();

    if (!draggedItem) return;

    // 같은 폴더로 드롭하는 경우 무시
    if (targetFolder === draggedItem.fileName && draggedItem.isFolder) {
      setDraggedItem(undefined);
      return;
    }

    // 폴더를 자신의 하위 폴더로 드롭하는 경우 방지
    if (draggedItem.isFolder && targetFolder) {
      const draggedPath = `${draggedItem.fileName}/`;
      if (targetFolder.startsWith(draggedPath)) {
        alert("폴더를 자신의 하위 폴더로 이동할 수 없습니다.");
        setDraggedItem(undefined);
        return;
      }
    }

    // 파일 드레그시
    if (targetFolder && draggedItem.isFolder === false) {
      const result = await moveFileAction(targetFolder, draggedItem);
      if (result.success) {
        setDraggedItem(undefined);
      }
    }
  };

  return (
    <FileList55
      files={files}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedItem(undefined);
      }}
      draggedItem={draggedItem}
    />
  );
}

export function FileList55({
  files,
  onFileClick,
  onFileDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedItem,
}: {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  onFileDelete?: (key: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetFolder?: string) => void;
  onDragEnd: () => void;
  draggedItem?: FileItem | null;
  onDragStart: (file: FileItem) => void;
}) {
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
            onDragStart={() => {
              console.log(`onDragStart`);
              console.log(file);
              onDragStart(file);
            }}
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
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title="다운로드"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onFileDelete?.(file.key)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
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

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
