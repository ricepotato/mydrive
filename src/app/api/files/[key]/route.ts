import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const key = decodeURIComponent(params.key);
    
    // 사용자 본인의 파일만 삭제 가능
    if (!key.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
    }

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 