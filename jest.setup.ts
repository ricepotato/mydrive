// Jest 설정 파일
// 환경 변수 설정

// 통합 테스트를 위한 실제 환경 변수가 없는 경우에만 Mock 환경 변수 설정
// 통합 테스트를 실행하려면 실제 환경 변수를 설정하세요
if (
  !process.env.R2_ENDPOINT ||
  process.env.R2_ENDPOINT.includes("test-endpoint")
) {
  process.env.R2_ENDPOINT = "https://test-endpoint.com";
  process.env.R2_ACCESS_KEY_ID = "test-access-key";
  process.env.R2_SECRET_ACCESS_KEY = "test-secret-key";
  process.env.R2_BUCKET_NAME = "test-bucket";
}
