"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { FilePreview } from "@/components/FilePreview";
import { Upload, LogOut, User } from "lucide-react";

interface File {
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  previewUrl: string | null;
  isPreviewable: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // 로그인되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchFiles = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("파일 목록을 가져오는 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchFiles();
    }
  }, [session]);

  const handleFileUpload = () => {
    fetchFiles();
  };

  const handleFileDelete = async (key: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setFiles(files.filter(file => file.key !== key));
      }
    } catch (error) {
      console.error("파일 삭제 중 오류:", error);
    }
  };

  const handleFileClick = (file: File) => {
    if (file.isPreviewable) {
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">MyDrive</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>{session.user.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <FileUpload onUpload={handleFileUpload} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">내 파일</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">파일 목록을 불러오는 중...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">아직 파일이 없습니다. 파일을 업로드해보세요!</p>
            </div>
          ) : (
            <FileList
              files={files}
              onFileClick={handleFileClick}
              onFileDelete={handleFileDelete}
              formatFileSize={formatFileSize}
            />
          )}
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
    </div>
  );
}
