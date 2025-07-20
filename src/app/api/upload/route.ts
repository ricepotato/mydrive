import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 검증
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || 
        !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      console.error("R2 환경 변수가 설정되지 않았습니다:", {
        endpoint: !!process.env.R2_ENDPOINT,
        accessKeyId: !!process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
        bucketName: !!process.env.R2_BUCKET_NAME,
      });
      return NextResponse.json(
        { error: "스토리지 설정이 완료되지 않았습니다." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error("세션 정보 없음:", {
        session: !!session,
        user: !!session?.user,
        userId: session?.user?.id,
      });
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
    }

    console.log("업로드 시작:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session.user.id,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${session.user.id}/${Date.now()}-${file.name}`;

    console.log("R2 업로드 시도:", {
      bucket: BUCKET_NAME,
      key: key,
      bufferSize: buffer.length,
    });

    await r2Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          userId: session.user.id,
          uploadedAt: new Date().toISOString(),
        },
      })
    );

    console.log("업로드 성공:", key);

    return NextResponse.json({
      success: true,
      key,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    
    return NextResponse.json(
      { 
        error: "파일 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 