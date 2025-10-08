import {
  _Object,
  CommonPrefix,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export interface FileItem {
  key: string;
  fileName: string;
  size: number;
  lastModified?: Date;
  previewUrl?: string;
  isPreviewable?: boolean;
  isFolder?: boolean;
}

// 환경 변수 검증
const requiredEnvVars = {
  R2_ENDPOINT: process.env.R2_ENDPOINT,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
};

// 누락된 환경 변수 확인
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn("R2 환경 변수가 누락되었습니다:", missingVars);
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // 타임아웃 설정
  requestHandler: {
    requestTimeout: 30000, // 30초
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// R2 연결 테스트 함수
export async function testR2Connection() {
  try {
    const { ListBucketsCommand } = await import("@aws-sdk/client-s3");
    await r2Client.send(new ListBucketsCommand({}));
    console.log("R2 연결 성공");
    return true;
  } catch (error) {
    console.error("R2 연결 실패:", error);
    return false;
  }
}

export async function getFiles(prefix: string): Promise<FileItem[]> {
  console.log("getFiles", prefix);
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
    Delimiter: "/",
  });
  const response = await r2Client.send(command);

  const getFiles = (contents: _Object[] | undefined) => {
    if (!contents) {
      return [];
    }
    const files = contents.map((object) => {
      const key = object.Key!;
      const fileName = key.split("/").pop() || "";

      const originalName = fileName.includes("-")
        ? fileName.substring(fileName.indexOf("-") + 1)
        : fileName;

      const fileExtension = fileName.toLowerCase().split(".").pop();
      const isPreviewable = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "pdf",
        "mp4",
        "webm",
        "mov",
      ].includes(fileExtension || "");

      return {
        key,
        fileName: originalName,
        size: object.Size || 0,
        lastModified: object.LastModified,
        isFolder: false,
        isPreviewable,
      };
    });
    return files;
  };
  const getDirectories = (commonPrefixes: CommonPrefix[] | undefined) => {
    if (!commonPrefixes) {
      return [];
    }
    const directories =
      commonPrefixes.map((item) => {
        const cleanPrefix = item.Prefix!.replace(/\/$/, ""); // 마지막 / 제거
        return {
          key: cleanPrefix,
          fileName: cleanPrefix.replace(prefix, ""),
          size: 0,
          isFolder: true,
        };
      }) || [];
    return directories;
  };

  const files = getFiles(response.Contents);
  const directories = getDirectories(response.CommonPrefixes);

  const onlyFiles = files.filter((file) => file.fileName !== ".folder");
  return [...directories, ...onlyFiles];
}

export async function moveFile(sourceKey: string, destinationKey: string) {
  // CopySource는 URL 인코딩이 필요 (한글, 특수문자 처리)
  const encodedSourceKey = encodeURIComponent(sourceKey);
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${encodedSourceKey}`,
    Key: destinationKey,
  });
  const copyResponse = await r2Client.send(command);
  console.log(copyResponse);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: sourceKey,
  });
  const deleteResponse = await r2Client.send(deleteCommand);
  console.log(deleteResponse);

  return true;
}

export async function copyFile(sourceKey: string, destinationKey: string) {
  // CopySource는 URL 인코딩이 필요 (한글, 특수문자 처리)
  const encodedSourceKey = encodeURIComponent(sourceKey);
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${encodedSourceKey}`,
    Key: destinationKey,
  });
  const response = await r2Client.send(command);
  console.log(response);
  return true;
}

export async function createFolder(key: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: "",
    ContentType: "application/x-directory",
  });
  const response = await r2Client.send(command);
  console.log(response);
  return true;
}

export async function deleteFile(key: string) {
  console.log("deleteFile", key);
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await r2Client.send(command);

  if (response.$metadata.httpStatusCode !== 204) {
    console.warn("deleteFile failed", key);
    return false;
  }

  console.debug("deleteFile success", key);
  return true;
}

export async function deleteFolderRecursive(prefix: string) {
  console.log("deleteFolderRecursive", prefix);
  const result = await getFiles(`${prefix}/`);
  const files = result.filter((file) => file.isFolder === false);
  const folders = result.filter((file) => file.isFolder === true);
  await Promise.all(files.map((file) => deleteFile(file.key)));
  await Promise.all(folders.map((folder) => deleteFolderRecursive(folder.key)));
  await deleteFile(`${prefix}/.folder`);
  return true;
}

export async function moveFolder(sourceKey: string, destinationKey: string) {
  console.log("moveFolder", sourceKey, "->", destinationKey);

  // 먼저 목적지에 폴더 생성
  await createFolder(`${destinationKey}/.folder`);

  // 소스 폴더의 내용 가져오기
  const result = await getFiles(`${sourceKey}/`);
  const files = result.filter((file) => file.isFolder === false);
  const folders = result.filter((file) => file.isFolder === true);

  if (files.length > 0) {
    await Promise.all(
      files.map((file) => {
        /**
         * sourceKey: /user/123/folder1
         * destinationKey: /user/123/folder2
         * newKey: /user/123/folder2/folder1
         */
        const src = file.key.split("/");
        const lastComponent = src.pop();
        const sourceFolder = src.pop();
        const newKey = `${destinationKey}/${sourceFolder}/${lastComponent}`;

        console.log(`파일 복사: ${file.key} -> ${newKey}`);
        return copyFile(file.key, newKey);
      })
    );
  }

  // 폴더 이동: 재귀적으로 처리
  if (folders.length > 0) {
    await Promise.all(
      folders.map((folder) => {
        const relativePath = folder.key.replace(`${sourceKey}/`, "");
        const newKey = `${destinationKey}/${relativePath}`;
        console.log(`폴더 이동: ${folder.key} -> ${newKey}`);
        //return moveFolder(folder.key, newKey);
      })
    );
  }

  // 원본 폴더 삭제
  //await deleteFolderRecursive(sourceKey);
  console.log(`deleteFolderRecursive ${sourceKey}`);
  return true;
}

// 테스트용 파일 업로드 함수
export async function uploadFile(key: string, content: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: content,
  });
  const response = await r2Client.send(command);
  console.log(`파일 업로드: ${key}`);
  return response;
}
