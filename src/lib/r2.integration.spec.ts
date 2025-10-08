import {
  createFolder,
  deleteFile,
  getFiles,
  r2Client,
  BUCKET_NAME,
  uploadFile,
  moveFolder,
  deleteFolderRecursive,
} from "./r2";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * 통합 테스트 (Integration Test)
 *
 * 이 테스트는 실제 R2 버킷에 연결하여 테스트를 수행합니다.
 * 실제 환경 변수가 설정되어 있어야 합니다:
 * - R2_ENDPOINT
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 *
 * 실행 방법:
 * npm test -- r2.integration.spec.ts
 */

describe("r2.ts - createFolder Integration Test", () => {
  // 테스트용 폴더 키 (타임스탬프를 추가하여 중복 방지)
  const testFolderPrefix = `test-integration-${Date.now()}`;
  const createdFolders: string[] = [];

  // 각 테스트 후 생성된 폴더 정리
  afterEach(async () => {
    for (const folderKey of createdFolders) {
      try {
        await deleteFile(folderKey);
        console.log(`정리 완료: ${folderKey}`);
      } catch (error) {
        console.warn(`정리 실패: ${folderKey}`, error);
      }
    }
    createdFolders.length = 0;
  });

  // 환경 변수 확인
  beforeAll(() => {
    const requiredEnvVars = [
      "R2_ENDPOINT",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      console.warn(
        `⚠️  경고: 다음 환경 변수가 설정되지 않았습니다: ${missingVars.join(
          ", "
        )}`
      );
      console.warn("통합 테스트를 건너뜁니다.");
    }
  });

  // 실제 환경 변수가 없으면 테스트 건너뛰기 (Mock 환경 변수 체크)
  const skipIfNoEnv = () => {
    const hasRealEnv =
      process.env.R2_ENDPOINT &&
      !process.env.R2_ENDPOINT.includes("test-endpoint") &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_ACCESS_KEY_ID !== "test-access-key";

    if (!hasRealEnv) {
      console.log("⏭️  실제 R2 환경 변수가 설정되지 않아 테스트를 건너뜁니다.");
      console.log(
        "   통합 테스트를 실행하려면 실제 R2 환경 변수를 설정하세요."
      );
      console.log("   자세한 내용은 src/lib/README.test.md를 참조하세요.");
    }
    return !hasRealEnv;
  };

  it("실제 R2 버킷에 폴더를 생성할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 테스트용 폴더 키
    const folderKey = `${testFolderPrefix}/test-folder-1/.folder`;
    createdFolders.push(folderKey);

    // When: 실제로 폴더 생성
    const result = await createFolder(folderKey);

    // Then: 결과가 true여야 함
    expect(result).toBe(true);

    // 실제로 폴더가 생성되었는지 확인
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: folderKey,
    });
    const response = await r2Client.send(command);

    expect(response.Contents).toBeDefined();
    expect(response.Contents?.length).toBeGreaterThan(0);
    expect(response.Contents?.[0].Key).toBe(folderKey);
  });

  it("중첩된 폴더 경로를 실제로 생성할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 중첩된 폴더 구조
    const parentFolder = `${testFolderPrefix}/parent/.folder`;
    const childFolder = `${testFolderPrefix}/parent/child/.folder`;
    const grandchildFolder = `${testFolderPrefix}/parent/child/grandchild/.folder`;

    createdFolders.push(grandchildFolder, childFolder, parentFolder);

    // When: 중첩된 폴더들을 차례로 생성
    await createFolder(parentFolder);
    await createFolder(childFolder);
    const result = await createFolder(grandchildFolder);

    // Then: 모두 생성되어야 함
    expect(result).toBe(true);

    // getFiles로 검증
    const files = await getFiles(`${testFolderPrefix}/parent/child/`);
    const hasGrandchild = files.some(
      (file) =>
        file.key === `${testFolderPrefix}/parent/child/grandchild` &&
        file.isFolder
    );
    expect(hasGrandchild).toBe(true);
  });

  it("동일한 폴더를 여러 번 생성해도 성공해야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 동일한 폴더 키
    const folderKey = `${testFolderPrefix}/duplicate-test/.folder`;
    createdFolders.push(folderKey);

    // When: 동일한 폴더를 두 번 생성
    const result1 = await createFolder(folderKey);
    const result2 = await createFolder(folderKey);

    // Then: 둘 다 성공해야 함 (S3는 덮어쓰기를 허용)
    expect(result1).toBe(true);
    expect(result2).toBe(true);

    // 폴더가 존재하는지 확인
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: folderKey,
    });
    const response = await r2Client.send(command);
    expect(response.Contents?.length).toBe(1);
  });

  it("한글 이름을 포함한 폴더를 생성할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 한글이 포함된 폴더 키
    const folderKey = `${testFolderPrefix}/한글폴더/.folder`;
    createdFolders.push(folderKey);

    // When: 한글 폴더 생성
    const result = await createFolder(folderKey);

    // Then: 성공해야 함
    expect(result).toBe(true);

    // 실제로 생성되었는지 확인
    const files = await getFiles(`${testFolderPrefix}/`);
    const hasKoreanFolder = files.some(
      (file) => file.key === `${testFolderPrefix}/한글폴더` && file.isFolder
    );
    expect(hasKoreanFolder).toBe(true);
  });

  it("특수 문자를 포함한 폴더를 생성할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 특수 문자가 포함된 폴더 키 (URL 안전한 문자들)
    const folderKey = `${testFolderPrefix}/test_folder-123/.folder`;
    createdFolders.push(folderKey);

    // When: 특수 문자 폴더 생성
    const result = await createFolder(folderKey);

    // Then: 성공해야 함
    expect(result).toBe(true);

    // 검증
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: folderKey,
    });
    const response = await r2Client.send(command);
    expect(response.Contents?.length).toBeGreaterThan(0);
  });
});

describe("r2.ts - moveFolder Integration Test", () => {
  const testFolderPrefix = `test-move-${Date.now()}`;
  const foldersToCleanup: string[] = [];

  // 테스트 후 정리
  afterEach(async () => {
    for (const folderKey of foldersToCleanup) {
      try {
        await deleteFolderRecursive(folderKey);
        console.log(`정리 완료: ${folderKey}`);
      } catch (error) {
        console.warn(`정리 실패: ${folderKey}`, error);
      }
    }
    foldersToCleanup.length = 0;
  });

  // 실제 환경 변수가 없으면 테스트 건너뛰기
  const skipIfNoEnv = () => {
    const hasRealEnv =
      process.env.R2_ENDPOINT &&
      !process.env.R2_ENDPOINT.includes("test-endpoint") &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_ACCESS_KEY_ID !== "test-access-key";

    if (!hasRealEnv) {
      console.log("⏭️  실제 R2 환경 변수가 설정되지 않아 테스트를 건너뜁니다.");
      console.log(
        "   통합 테스트를 실행하려면 실제 R2 환경 변수를 설정하세요."
      );
      console.log("   자세한 내용은 src/lib/README.test.md를 참조하세요.");
    }
    return !hasRealEnv;
  };

  it("중첩된 폴더와 파일을 다른 위치로 이동할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 소스 폴더 구조 생성
    const sourceFolder = `${testFolderPrefix}/source-folder`;
    const subFolder = `${sourceFolder}/subfolder`;
    const destinationFolder = `${testFolderPrefix}/destination-folder`;

    // 정리 목록에 추가 (역순으로 추가하여 중첩된 것부터 삭제)
    foldersToCleanup.push(destinationFolder, sourceFolder);

    // 폴더 생성
    await createFolder(`${sourceFolder}/.folder`);
    await createFolder(`${subFolder}/.folder`);

    // 파일 업로드
    await uploadFile(`${sourceFolder}/file1.txt`, "Content of file 1");
    await uploadFile(`${sourceFolder}/file2.txt`, "Content of file 2");
    await uploadFile(`${subFolder}/file3.txt`, "Content of file 3");
    await uploadFile(`${subFolder}/file4.txt`, "Content of file 4");

    // When: 폴더 이동
    const result = await moveFolder(sourceFolder, destinationFolder);

    // Then: 이동 성공
    expect(result).toBe(true);

    // 목적지 폴더의 파일 확인
    const destinationFiles = await getFiles(`${destinationFolder}/`);
    console.log("목적지 파일들:", destinationFiles);

    // 루트 레벨 파일 확인
    const rootFile1 = destinationFiles.find(
      (f) => f.key === `${destinationFolder}/file1.txt`
    );
    const rootFile2 = destinationFiles.find(
      (f) => f.key === `${destinationFolder}/file2.txt`
    );
    expect(rootFile1).toBeDefined();
    expect(rootFile2).toBeDefined();

    // 서브폴더 확인
    const subFolderExists = destinationFiles.find(
      (f) => f.key === `${destinationFolder}/subfolder` && f.isFolder
    );
    expect(subFolderExists).toBeDefined();

    // 서브폴더의 파일 확인
    const subFolderFiles = await getFiles(`${destinationFolder}/subfolder/`);
    console.log("서브폴더 파일들:", subFolderFiles);

    const subFile3 = subFolderFiles.find(
      (f) => f.key === `${destinationFolder}/subfolder/file3.txt`
    );
    const subFile4 = subFolderFiles.find(
      (f) => f.key === `${destinationFolder}/subfolder/file4.txt`
    );
    expect(subFile3).toBeDefined();
    expect(subFile4).toBeDefined();

    // 원본 폴더가 삭제되었는지 확인
    const sourceFiles = await getFiles(`${sourceFolder}/`);
    expect(sourceFiles.length).toBe(0);
  });

  it("빈 폴더를 이동할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 빈 소스 폴더
    const sourceFolder = `${testFolderPrefix}/empty-source`;
    const destinationFolder = `${testFolderPrefix}/empty-destination`;

    foldersToCleanup.push(destinationFolder, sourceFolder);

    // 빈 폴더 생성
    await createFolder(`${sourceFolder}/.folder`);

    // When: 빈 폴더 이동
    const result = await moveFolder(sourceFolder, destinationFolder);

    // Then: 성공
    expect(result).toBe(true);

    // 목적지에 .folder 파일이 있는지 확인
    const destinationFiles = await getFiles(`${destinationFolder}/`);
    expect(destinationFiles.length).toBe(0); // .folder는 getFiles에서 필터링됨

    // 직접 확인
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${destinationFolder}/.folder`,
    });
    const response = await r2Client.send(command);
    expect(response.Contents?.length).toBeGreaterThan(0);

    // 원본 폴더가 삭제되었는지 확인
    const sourceFiles = await getFiles(`${sourceFolder}/`);
    expect(sourceFiles.length).toBe(0);
  });

  it("한글 파일명을 포함한 폴더를 이동할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 한글 파일명이 포함된 소스 폴더
    const sourceFolder = `${testFolderPrefix}/한글-source`;
    const destinationFolder = `${testFolderPrefix}/한글-destination`;

    foldersToCleanup.push(destinationFolder, sourceFolder);

    // 폴더 생성
    await createFolder(`${sourceFolder}/.folder`);

    // 한글 파일명으로 파일 업로드
    await uploadFile(`${sourceFolder}/한글파일.txt`, "한글 내용");
    await uploadFile(`${sourceFolder}/테스트파일.pdf`, "테스트 내용");
    await uploadFile(`${sourceFolder}/문서 파일.docx`, "문서 내용");

    // When: 폴더 이동
    const result = await moveFolder(sourceFolder, destinationFolder);

    // Then: 이동 성공
    expect(result).toBe(true);

    // 목적지 폴더의 파일 확인
    const destinationFiles = await getFiles(`${destinationFolder}/`);
    console.log("한글 파일 목적지:", destinationFiles);

    // 한글 파일들이 존재하는지 확인
    const file1 = destinationFiles.find((f) => f.fileName === "한글파일.txt");
    const file2 = destinationFiles.find((f) => f.fileName === "테스트파일.pdf");
    const file3 = destinationFiles.find((f) => f.fileName === "문서 파일.docx");

    expect(file1).toBeDefined();
    expect(file2).toBeDefined();
    expect(file3).toBeDefined();

    // 원본 폴더가 삭제되었는지 확인
    const sourceFiles = await getFiles(`${sourceFolder}/`);
    expect(sourceFiles.length).toBe(0);
  });

  it("여러 단계로 중첩된 폴더 구조를 이동할 수 있어야 합니다", async () => {
    if (skipIfNoEnv()) {
      return;
    }

    // Given: 깊게 중첩된 폴더 구조
    const sourceFolder = `${testFolderPrefix}/deep-source`;
    const level1 = `${sourceFolder}/level1`;
    const level2 = `${level1}/level2`;
    const level3 = `${level2}/level3`;
    const destinationFolder = `${testFolderPrefix}/deep-destination`;

    foldersToCleanup.push(destinationFolder, sourceFolder);

    // 폴더 구조 생성
    await createFolder(`${sourceFolder}/.folder`);
    await createFolder(`${level1}/.folder`);
    await createFolder(`${level2}/.folder`);
    await createFolder(`${level3}/.folder`);

    // 각 레벨에 파일 추가
    await uploadFile(`${sourceFolder}/root.txt`, "root");
    await uploadFile(`${level1}/level1.txt`, "level1");
    await uploadFile(`${level2}/level2.txt`, "level2");
    await uploadFile(`${level3}/level3.txt`, "level3");

    // When: 전체 구조 이동
    const result = await moveFolder(sourceFolder, destinationFolder);

    // Then: 성공
    expect(result).toBe(true);

    // 목적지에서 모든 레벨의 파일 확인
    const rootFiles = await getFiles(`${destinationFolder}/`);
    expect(
      rootFiles.find((f) => f.key === `${destinationFolder}/root.txt`)
    ).toBeDefined();
    expect(
      rootFiles.find(
        (f) => f.key === `${destinationFolder}/level1` && f.isFolder
      )
    ).toBeDefined();

    const level1Files = await getFiles(`${destinationFolder}/level1/`);
    expect(
      level1Files.find(
        (f) => f.key === `${destinationFolder}/level1/level1.txt`
      )
    ).toBeDefined();
    expect(
      level1Files.find(
        (f) => f.key === `${destinationFolder}/level1/level2` && f.isFolder
      )
    ).toBeDefined();

    const level2Files = await getFiles(`${destinationFolder}/level1/level2/`);
    expect(
      level2Files.find(
        (f) => f.key === `${destinationFolder}/level1/level2/level2.txt`
      )
    ).toBeDefined();
    expect(
      level2Files.find(
        (f) =>
          f.key === `${destinationFolder}/level1/level2/level3` && f.isFolder
      )
    ).toBeDefined();

    const level3Files = await getFiles(
      `${destinationFolder}/level1/level2/level3/`
    );
    expect(
      level3Files.find(
        (f) => f.key === `${destinationFolder}/level1/level2/level3/level3.txt`
      )
    ).toBeDefined();

    // 원본 폴더가 삭제되었는지 확인
    const sourceFiles = await getFiles(`${sourceFolder}/`);
    expect(sourceFiles.length).toBe(0);
  });
});
