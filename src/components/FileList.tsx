"use client";

import { 
  File, 
  Image, 
  FileText, 
  Video, 
  Download, 
  Trash2, 
  Eye
} from "lucide-react";

interface FileItem {
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  previewUrl: string | null;
  isPreviewable: boolean;
}

interface FileListProps {
  files: FileItem[];
  onFileClick: (file: FileItem) => void;
  onFileDelete: (key: string) => void;
  formatFileSize: (bytes: number) => string;
}

export function FileList({ files, onFileClick, onFileDelete, formatFileSize }: FileListProps) {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension || "")) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension || "")) {
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
      {files.map((file) => (
        <div
          key={file.key}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => onFileClick(file)}
          >
            {getFileIcon(file.fileName)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(file.size)} • {formatDate(file.lastModified)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {file.isPreviewable && (
              <button
                onClick={() => onFileClick(file)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="미리보기"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => handleDownload(file.key, file.fileName)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => onFileDelete(file.key)}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 