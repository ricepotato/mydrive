"use server";

import { authOptions } from "@/lib/auth";
import {
  BUCKET_NAME,
  FileItem,
  createFolder,
  deleteFile,
  deleteFolderRecursive,
  moveFile,
  r2Client,
  moveFolder,
} from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function uploadFileAction(formData: FormData) {
  let file: File | undefined = undefined;
  try {
    const session = await getSession();
    const path = formData.get("path") as string;

    file = formData.get("file") as File;
    console.debug("업로드 시작:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: session.user.id,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    let key = "";
    if (path === "") {
      key = `${session.user.id}/${file.name}`;
    } else {
      key = `${session.user.id}/${path}/${file.name}`;
    }

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
    return { success: false, fileName: file ? file.name : "" };
  }
}

export async function moveFileAction(targetFolderKey: string, file: FileItem) {
  try {
    const session = await getSession();
    const newKey = `${session.user.id}/${targetFolderKey}/${file.fileName}`;

    console.log(`renameCommand: Key: ${newKey}, RenameSource: ${file.key}`);

    await moveFile(file.key, newKey);

    revalidatePath("/drive");
    return { success: true, fileName: file.fileName };
  } catch (error) {
    console.error("파일 이동 오류:", error);
    return { success: false, fileName: file.fileName };
  }
}

export async function moveFolderAction(
  sourceKey: string,
  destinationFolder: string
) {
  try {
    const session = await getSession();
    await moveFolder(sourceKey, `${session.user.id}/${destinationFolder}`);
  } catch (error) {
    console.error("폴더 이동 오류:", error);
    return { success: false, fileName: sourceKey };
  }

  revalidatePath("/drive");
  return { success: true, fileName: sourceKey };
}

export async function createFolderAction(targetFolderKey: string) {
  try {
    const session = await getSession();
    const key = `${session.user.id}/${targetFolderKey}/.folder`;
    await createFolder(key);
  } catch (error) {
    console.error("폴더 생성 오류:", error);
    return { success: false, fileName: targetFolderKey };
  }

  revalidatePath("/drive");
  return { success: true, fileName: targetFolderKey };
}

export async function deleteFolderAction(targetFolderKey: string) {
  try {
    console.log("deleteFolderAction", targetFolderKey);
    await deleteFolderRecursive(targetFolderKey);
  } catch (error) {
    console.error("폴더 삭제 오류:", error);
    return { success: false, fileName: targetFolderKey };
  }

  revalidatePath("/drive");
  return { success: true, fileName: targetFolderKey };
}

export async function deleteFileAction(targetFileKey: string) {
  try {
    console.log("deleteFileAction", targetFileKey);
    // targetFileKey는 이미 전체 key이므로 그대로 사용
    await deleteFile(targetFileKey);
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    return { success: false, fileName: targetFileKey };
  }

  revalidatePath("/drive");
  return { success: true, fileName: targetFileKey };
}

export async function revalidatePathAction(path: string) {
  revalidatePath(path);
}

async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
