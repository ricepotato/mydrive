import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || `${session.user.id}/`;

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2Client.send(command);
    
    if (!response.Contents) {
      return NextResponse.json({ files: [] });
    }

    const files = await Promise.all(
      response.Contents.map(async (object) => {
        const key = object.Key!;
        const fileName = key.split("/").pop() || "";
        
        // 폴더 마커 파일인지 확인
        const isFolder = fileName === ".folder";
        
        if (isFolder) {
          // 폴더의 경우 상위 디렉토리 이름을 사용
          const folderName = key.split("/").slice(-2, -1)[0] || "";
          return {
            key,
            fileName: folderName,
            size: 0,
            lastModified: object.LastModified,
            previewUrl: null,
            isPreviewable: false,
            isFolder: true,
          };
        }

        const originalName = fileName.includes("-") 
          ? fileName.substring(fileName.indexOf("-") + 1)
          : fileName;

        // 미리보기 URL 생성 (이미지, PDF, 비디오만)
        let previewUrl = null;
        const fileExtension = fileName.toLowerCase().split(".").pop();
        const isPreviewable = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "mp4", "webm", "mov"].includes(fileExtension || "");

        if (isPreviewable) {
          const getObjectCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
          });
          previewUrl = await getSignedUrl(r2Client, getObjectCommand, { expiresIn: 3600 });
        }

        return {
          key,
          fileName: originalName,
          size: object.Size || 0,
          lastModified: object.LastModified,
          previewUrl,
          isPreviewable,
          isFolder: false,
        };
      })
    );

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Files list error:", error);
    return NextResponse.json(
      { error: "파일 목록을 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 