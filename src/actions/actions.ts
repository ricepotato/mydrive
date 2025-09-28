"use server";

import { authOptions } from "@/lib/auth";
import { BUCKET_NAME, r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadFile(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      redirect("/login");
    }

    const file = formData.get("file") as File;
    console.debug("업로드 시작:", {
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

    revalidatePath("/drive");
    return { success: true, fileName: file.name };
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return { success: false, fileName: file.name };
  }
}
