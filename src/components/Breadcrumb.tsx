"use client";

import { ChevronRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function Breadcrumb() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const path = searchParams.get("path");
  const currentPath = path ? path.split("/") : [];
  console.log(currentPath);
  return (
    <div className="flex items-center gap-2 h-7">
      <div className="flex justify-center items-center w-7">
        {currentPath.length > 0 && (
          <button
            onClick={() => {
              router.back();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            title="뒤로가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 text-sm text-gray-600">
        <button
          onClick={() => {
            router.push("/drive");
          }}
          className="hover:text-blue-600 transition-colors cursor-pointer"
        >
          홈
        </button>

        {currentPath.map((folder, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => {
                router.push(
                  `/drive?path=${currentPath.slice(0, index + 1).join("/")}`
                );
              }}
              className={`hover:text-blue-600 transition-colors ${
                index === currentPath.length - 1
                  ? "text-blue-600 cursor-default"
                  : "cursor-pointer"
              }`}
            >
              {folder}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
