import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const key = decodeURIComponent(params.key);
    
    // 사용자 본인의 파일만 다운로드 가능
    if (!key.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    return NextResponse.json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "파일 다운로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 