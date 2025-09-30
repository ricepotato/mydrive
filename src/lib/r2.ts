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

      return {
        key,
        fileName: originalName,
        size: object.Size || 0,
        lastModified: object.LastModified,
        isFolder: false,
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
  const command = new CopyObjectCommand({
    Bucket: BUCKET_NAME,
    CopySource: `${BUCKET_NAME}/${sourceKey}`,
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
  console.log("deleteFolderRecursive files", files);
  const folders = result.filter((file) => file.isFolder === true);
  await Promise.all(files.map((file) => deleteFile(file.key)));
  await Promise.all(folders.map((folder) => deleteFolderRecursive(folder.key)));
  await deleteFile(`${prefix}/.folder`);
  return true;
}
