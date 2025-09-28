"use client";

import { ChevronRight, ArrowLeft } from "lucide-react";

interface BreadcrumbProps {
  currentPath: string[];
  onBreadcrumbClick: (index: number) => void;
  onGoBack: () => void;
}

export function Breadcrumb({
  currentPath,
  onBreadcrumbClick,
  onGoBack,
}: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2">
      {currentPath.length > 0 && (
        <button
          onClick={onGoBack}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="뒤로가기"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-1 text-sm text-gray-600">
        <button
          onClick={() => onBreadcrumbClick(-1)}
          className="hover:text-blue-600 transition-colors"
        >
          홈
        </button>

        {currentPath.map((folder, index) => (
          <div key={index} className="flex items-center gap-1">
            <ChevronRight className="w-4 h-4" />
            <button
              onClick={() => onBreadcrumbClick(index)}
              className="hover:text-blue-600 transition-colors"
            >
              {folder}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
