import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_NAME } from "@/lib/r2";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { folderName } = await request.json();
    
    if (!folderName || folderName.trim() === "") {
      return NextResponse.json({ error: "폴더 이름이 필요합니다." }, { status: 400 });
    }

    // 폴더 이름 검증 (특수문자 제한)
    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9가-힣\s_-]/g, "");
    if (sanitizedFolderName !== folderName.trim()) {
      return NextResponse.json({ 
        error: "폴더 이름에는 영문, 한글, 숫자, 공백, 하이픈, 언더스코어만 사용할 수 있습니다." 
      }, { status: 400 });
    }

    const folderKey = `${session.user.id}/${sanitizedFolderName}/.folder`;
    
    // 폴더 마커 파일 생성 (빈 파일로 폴더를 표시)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: folderKey,
      Body: "",
      ContentType: "application/x-directory",
    });

    await r2Client.send(command);

    return NextResponse.json({ 
      success: true, 
      message: "폴더가 성공적으로 생성되었습니다.",
      folderKey 
    });

  } catch (error) {
    console.error("폴더 생성 오류:", error);
    return NextResponse.json(
      { error: "폴더 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
