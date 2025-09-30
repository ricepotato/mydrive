"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { FileListView } from "@/components/FileList";
import { FilePreview } from "@/components/FilePreview";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Upload, FolderPlus } from "lucide-react";

interface File {
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  previewUrl: string | null;
  isPreviewable: boolean;
  isFolder?: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<File | null>(null);

  // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchFiles = useCallback(
    async (path: string[] = currentPath) => {
      if (!session?.user?.id) return;

      setLoading(true);
      try {
        const prefix =
          path.length > 0
            ? `${session.user.id}/${path.join("/")}/`
            : `${session.user.id}/`;
        const response = await fetch(
          `/api/files?prefix=${encodeURIComponent(prefix)}`
        );
        const data = await response.json();
        console.log(data);
        if (data.files) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error("파일 목록을 가져오는 중 오류:", error);
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.id, currentPath]
  );

  useEffect(() => {
    if (session?.user?.id) {
      fetchFiles();
    }
  }, [session, fetchFiles]);

  const handleFileUpload = () => {
    fetchFiles();
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert("폴더 이름을 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName: folderName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateFolder(false);
        setFolderName("");
        fetchFiles(); // 파일 목록 새로고침
        alert("폴더가 성공적으로 생성되었습니다.");
      } else {
        alert(data.error || "폴더 생성 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("폴더 생성 오류:", error);
      alert("폴더 생성 중 오류가 발생했습니다.");
    }
  };

  const handleFileDelete = async (key: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(files.filter((file) => file.key !== key));
      }
    } catch (error) {
      console.error("파일 삭제 중 오류:", error);
    }
  };

  const handleFileClick = (file: File) => {
    if (file.isFolder) {
      // 폴더 클릭 시 해당 폴더로 이동
      const newPath = [...currentPath, file.fileName];
      setCurrentPath(newPath);
      fetchFiles(newPath);
    } else if (file.isPreviewable) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = currentPath.slice(0, index + 1);
    setCurrentPath(newPath);
    fetchFiles(newPath);
  };

  const goBack = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      fetchFiles(newPath);
    }
  };

  const handleMoveFile = async (
    sourceKey: string,
    destinationFolder?: string
  ) => {
    try {
      const response = await fetch("/api/files/move", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceKey,
          destinationFolder: destinationFolder ? destinationFolder : "",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        fetchFiles(); // 파일 목록 새로고침
        return true;
      } else {
        alert(data.error || "파일 이동 중 오류가 발생했습니다.");
        return false;
      }
    } catch (error) {
      console.error("파일 이동 오류:", error);
      alert("파일 이동 중 오류가 발생했습니다.");
      return false;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDragStart = (file: File) => {
    setDraggedItem(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetFolder?: string) => {
    e.preventDefault();

    if (!draggedItem) return;

    // 같은 폴더로 드롭하는 경우 무시
    if (targetFolder === draggedItem.fileName && draggedItem.isFolder) {
      setDraggedItem(null);
      return;
    }

    // 폴더를 자신의 하위 폴더로 드롭하는 경우 방지
    if (draggedItem.isFolder && targetFolder) {
      const draggedPath = `${draggedItem.fileName}/`;
      if (targetFolder.startsWith(draggedPath)) {
        alert("폴더를 자신의 하위 폴더로 이동할 수 없습니다.");
        setDraggedItem(null);
        return;
      }
    }

    const success = await handleMoveFile(draggedItem.key, targetFolder);
    if (success) {
      setDraggedItem(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={session.user.name || "사용자"} />

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <FileUpload onUpload={handleFileUpload} />
        </div>

        <div className="flex justify-end my-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FolderPlus className="w-5 h-5" />
            폴더 만들기
          </button>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-gray-900">내 파일</h2>

              {/* 브레드크럼 네비게이션 */}
              <Breadcrumb
                currentPath={currentPath}
                onBreadcrumbClick={handleBreadcrumbClick}
                onGoBack={goBack}
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">파일 목록을 불러오는 중...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                아직 파일이 없습니다. 파일을 업로드해보세요!
              </p>
            </div>
          ) : null}
        </div>
      </main>

      {/* 파일 미리보기 모달 */}
      {showPreview && selectedFile && (
        <FilePreview
          file={selectedFile}
          onClose={() => {
            setShowPreview(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* 폴더 생성 모달 */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              새 폴더 만들기
            </h3>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="폴더 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setFolderName("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
