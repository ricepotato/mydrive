"use client";

import { revalidatePathAction } from "@/actions/actions";
import { AlertCircle, Check, Upload, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  useDropzone,
  FileWithPath,
  FileRejection,
  DropEvent,
} from "react-dropzone";

interface UploadStatus {
  [key: string]: {
    progress: number;
    status: "uploading" | "success" | "error";
    error?: string;
  };
}

export function FileUploadContainer() {
  return (
    <div className="mb-8">
      <FileUpload />
    </div>
  );
}

export function FileUpload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({});

  const onDrop = useCallback(
    async (
      acceptedFiles: FileWithPath[],
      fileRejections: FileRejection[],
      event: DropEvent
    ) => {
      // Handle rejected files if any
      if (fileRejections.length > 0) {
        console.warn("Some files were rejected:", fileRejections);
      }
      // Event is available but not used in current implementation
      void event;

      setUploading(true);
      setUploadStatus({});

      // 초기 상태 설정
      const initialStatus: UploadStatus = {};
      acceptedFiles.forEach((file) => {
        initialStatus[file.name] = { progress: 0, status: "uploading" };
      });
      setUploadStatus(initialStatus);

      const submitUploadForm = async (file: FileWithPath) => {
        let key = "";
        if (searchParams.get("path") === null) {
          // remove first '/' from path
          key = (file.path || file.name).replace(/^\/+/, "");
        } else {
          key = `${searchParams.get("path") || ""}/${file.name.replace(
            /^\/+/,
            ""
          )}`;
        }
        const response = await fetch(`/api/v1/presignedUrl?key=${key}`);
        if (response.status === 401) {
          console.error("인증 실패");
          router.push("/login");
          return { success: false, fileName: file.name };
        }
        const data = await response.json();

        const putResponse = await fetch(data.presignedUrl, {
          method: "PUT",
          body: file,
        });

        if (putResponse.status === 200) {
          return { success: true, fileName: file.name };
        } else {
          console.error(
            `${file.name} 업로드 실패 status: ${putResponse.status}`
          );
          return { success: false, fileName: file.name };
        }
      };

      console.log(acceptedFiles);

      const uploadResults = await Promise.all(
        acceptedFiles.map((file) => submitUploadForm(file))
      );

      uploadResults.forEach((result) => {
        if (result.success) {
          setUploadStatus((prev) => ({
            ...prev,
            [result.fileName]: { progress: 100, status: "success" },
          }));
        }
      });

      await revalidatePathAction("/drive");

      setUploading(false);

      // 5초 후 상태 초기화
      setTimeout(() => {
        setUploadStatus({});
      }, 5000);
    },
    [router, searchParams]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 200 * 1024 * 1024, // 200MB 제한
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Check className="w-4 h-4 text-green-500" />;
      case "error":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "업로드 완료";
      case "error":
        return "업로드 실패";
      default:
        return "업로드 중...";
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">파일을 여기에 놓으세요</p>
        ) : (
          <div>
            <p className="text-gray-600 font-bold mb-2">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500">
              이미지, 문서, 비디오 등 모든 파일 형식 지원 (최대 100MB)
            </p>
          </div>
        )}
      </div>

      {/* 업로드 진행률 */}
      {Object.keys(uploadStatus).length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium text-gray-900 mb-3">업로드 진행률</h3>
          <div className="space-y-3">
            {Object.entries(uploadStatus).map(([fileName, status]) => (
              <div key={fileName} className="space-y-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {fileName}
                  </span>
                  <span
                    className={`text-sm ${
                      status.status === "success"
                        ? "text-green-600"
                        : status.status === "error"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {getStatusText(status.status)}
                  </span>
                </div>

                {status.status === "uploading" && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.progress}%` }}
                    ></div>
                  </div>
                )}

                {status.status === "error" && status.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4" />
                    <span>{status.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && Object.keys(uploadStatus).length === 0 && (
        <div className="text-center text-sm text-gray-600">
          파일을 업로드하는 중입니다...
        </div>
      )}
    </div>
  );
}
