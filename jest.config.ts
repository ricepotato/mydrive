import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 next.config.js와 .env 파일을 로드합니다
  dir: "./",
});

// Jest에 전달할 사용자 정의 설정
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testTimeout: 30000, // 30초 타임아웃 (통합 테스트용)
};

// createJestConfig는 비동기 함수이므로 내보내기 전에 호출해야 합니다
export default createJestConfig(config);
