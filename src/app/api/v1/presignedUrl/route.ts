import { authOptions } from "@/lib/auth";
import { r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

const createPresignedUrlWithClient = ({ key }: { key: string }) => {
  const putCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2Client, putCommand, { expiresIn: 3600 });
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  const keyWithId = `${session.user.id}/${key}`;
  const presignedUrl = await createPresignedUrlWithClient({ key: keyWithId });
  return NextResponse.json({ presignedUrl });
}
