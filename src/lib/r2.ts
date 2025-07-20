import { S3Client } from "@aws-sdk/client-s3";

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