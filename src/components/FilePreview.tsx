"use client";

import { useEffect, useState } from "react";
import { X, Download, Maximize2, Minimize2 } from "lucide-react";

interface FilePreviewProps {
  file: {
    key: string;
    fileName: string;
    size: number;
    lastModified: string;
    previewUrl: string | null;
    isPreviewable: boolean;
  };
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${encodeURIComponent(file.key)}`);
      const data = await response.json();
      
      if (data.downloadUrl) {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("다운로드 중 오류:", error);
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.toLowerCase().split(".").pop();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "image";
    } else if (extension === "pdf") {
      return "pdf";
    } else if (["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension || "")) {
      return "video";
    }
    return "unknown";
  };

  const renderPreview = () => {
    const fileType = getFileType(file.fileName);

    switch (fileType) {
      case "image":
        return (
          <img
            src={file.previewUrl || ""}
            alt={file.fileName}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        );
      case "video":
        return (
          <video
            src={file.previewUrl || ""}
            controls
            className="max-w-full max-h-full"
            onLoadedData={() => setLoading(false)}
            onError={() => setLoading(false)}
          >
            브라우저가 비디오를 지원하지 않습니다.
          </video>
        );
      case "pdf":
        return (
          <iframe
            src={file.previewUrl || ""}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">미리보기를 지원하지 않는 파일 형식입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full' : 'w-11/12 h-5/6 max-w-6xl'}`}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {file.fileName}
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title={isFullscreen ? "축소" : "전체화면"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="relative flex-1 p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <div className="w-full h-full flex items-center justify-center">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  );
} 