import { createFolder, r2Client, BUCKET_NAME } from "./r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// AWS SDK 모킹
jest.mock("@aws-sdk/client-s3", () => {
  const actual = jest.requireActual("@aws-sdk/client-s3");
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
  };
});

describe("r2.ts - createFolder", () => {
  let mockSend: jest.Mock;

  beforeEach(() => {
    // 각 테스트 전에 mock 초기화
    jest.clearAllMocks();
    mockSend = r2Client.send as jest.Mock;
  });

  it("폴더 키로 PutObjectCommand를 호출해야 합니다", async () => {
    // Given: 빈 응답을 반환하는 mock 설정
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });

    const testKey = "test-folder/.folder";

    // When: createFolder 함수 호출
    const result = await createFolder(testKey);

    // Then: 올바른 파라미터로 send가 호출되었는지 확인
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));

    // PutObjectCommand의 파라미터 확인
    const calledCommand = mockSend.mock.calls[0][0];
    expect(calledCommand.input).toEqual({
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: "",
      ContentType: "application/x-directory",
    });

    // 결과가 true인지 확인
    expect(result).toBe(true);
  });

  it("중첩된 폴더 경로로 폴더를 생성할 수 있어야 합니다", async () => {
    // Given
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });

    const nestedKey = "parent/child/grandchild/.folder";

    // When
    const result = await createFolder(nestedKey);

    // Then
    expect(mockSend).toHaveBeenCalledTimes(1);
    const calledCommand = mockSend.mock.calls[0][0];
    expect(calledCommand.input.Key).toBe(nestedKey);
    expect(result).toBe(true);
  });

  it("S3 에러가 발생하면 예외를 던져야 합니다", async () => {
    // Given: 에러를 던지는 mock 설정
    const testError = new Error("S3 Error");
    mockSend.mockRejectedValue(testError);

    const testKey = "error-folder/.folder";

    // When & Then: 에러가 발생하는지 확인
    await expect(createFolder(testKey)).rejects.toThrow("S3 Error");
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("빈 Body와 올바른 ContentType으로 요청해야 합니다", async () => {
    // Given
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
    });

    const testKey = "new-folder/.folder";

    // When
    await createFolder(testKey);

    // Then: Body가 빈 문자열이고 ContentType이 올바른지 확인
    const calledCommand = mockSend.mock.calls[0][0];
    expect(calledCommand.input.Body).toBe("");
    expect(calledCommand.input.ContentType).toBe("application/x-directory");
  });
});
