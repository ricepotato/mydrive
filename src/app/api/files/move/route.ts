import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { sourceKey, destinationFolder } = await request.json();
    
    if (!sourceKey) {
      return NextResponse.json({ error: "소스 키가 필요합니다." }, { status: 400 });
    }

    // 사용자 권한 확인
    if (!sourceKey.startsWith(`${session.user.id}/`)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 새로운 키 생성
    const fileName = sourceKey.split("/").pop() || "";
    const newKey = destinationFolder 
      ? `${session.user.id}/${destinationFolder}/${fileName}`
      : `${session.user.id}/${fileName}`;

    // 같은 위치로 이동하는 경우 무시
    if (sourceKey === newKey) {
      return NextResponse.json({ success: true, message: "이미 같은 위치에 있습니다." });
    }

    // 파일 복사
    const copyCommand = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${sourceKey}`,
      Key: newKey,
    });

    await r2Client.send(copyCommand);

    // 원본 파일 삭제
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: sourceKey,
    });

    await r2Client.send(deleteCommand);

    return NextResponse.json({ 
      success: true, 
      message: "파일이 성공적으로 이동되었습니다.",
      newKey 
    });

  } catch (error) {
    console.error("파일 이동 오류:", error);
    return NextResponse.json(
      { error: "파일 이동 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
