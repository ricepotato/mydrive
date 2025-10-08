# R2 테스트 가이드

이 문서는 R2 관련 테스트를 실행하는 방법을 설명합니다.

## 테스트 종류

### 1. 단위 테스트 (Unit Tests)

- 파일: `r2.spec.ts`
- Mock을 사용하여 AWS SDK를 시뮬레이션
- 실제 R2 연결 없이 실행 가능
- 빠르고 독립적인 테스트

```bash
npm run test:unit
```

### 2. 통합 테스트 (Integration Tests)

- 파일: `r2.integration.spec.ts`
- 실제 R2 버킷에 연결하여 테스트
- 실제 환경 변수 필요

```bash
npm run test:integration
```

## 통합 테스트 실행 방법

### 사전 준비

통합 테스트를 실행하려면 실제 R2 환경 변수를 설정해야 합니다.

#### 방법 1: 환경 변수 직접 설정 (Windows)

```bash
set R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
set R2_ACCESS_KEY_ID=your-access-key-id
set R2_SECRET_ACCESS_KEY=your-secret-access-key
set R2_BUCKET_NAME=your-bucket-name
npm run test:integration
```

#### 방법 2: .env.local 파일 사용

프로젝트 루트에 `.env.local` 파일 생성:

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

그 다음 테스트 실행:

```bash
npm run test:integration
```

#### 방법 3: Jest 설정 수정

`jest.setup.ts` 파일에서 실제 환경 변수로 수정:

```typescript
// jest.setup.ts
process.env.R2_ENDPOINT = "https://your-account-id.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY_ID = "your-access-key-id";
process.env.R2_SECRET_ACCESS_KEY = "your-secret-access-key";
process.env.R2_BUCKET_NAME = "your-bucket-name";
```

⚠️ **주의**: 실제 자격 증명을 코드에 커밋하지 마세요!

## 테스트 케이스

### 단위 테스트 (`r2.spec.ts`)

1. ✅ 폴더 키로 PutObjectCommand를 호출하는지 검증
2. ✅ 중첩된 폴더 경로로 폴더 생성 검증
3. ✅ S3 에러 발생 시 예외 처리 검증
4. ✅ 빈 Body와 올바른 ContentType 검증

### 통합 테스트 (`r2.integration.spec.ts`)

1. ✅ 실제 R2 버킷에 폴더 생성
2. ✅ 중첩된 폴더 경로 생성
3. ✅ 동일한 폴더 여러 번 생성 (덮어쓰기)
4. ✅ 한글 이름 포함 폴더 생성
5. ✅ 특수 문자 포함 폴더 생성

## 테스트 결과 예시

### 단위 테스트 성공

```
PASS src/lib/r2.spec.ts
  r2.ts - createFolder
    ✓ 폴더 키로 PutObjectCommand를 호출해야 합니다 (31 ms)
    ✓ 중첩된 폴더 경로로 폴더를 생성할 수 있어야 합니다 (10 ms)
    ✓ S3 에러가 발생하면 예외를 던져야 합니다 (10 ms)
    ✓ 빈 Body와 올바른 ContentType으로 요청해야 합니다 (3 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
```

### 통합 테스트 (환경 변수 없을 때)

```
⚠️  경고: 다음 환경 변수가 설정되지 않았습니다: R2_ENDPOINT, R2_ACCESS_KEY_ID, ...
통합 테스트를 건너뜁니다.
```

## 주의사항

1. **통합 테스트는 실제 R2 버킷을 사용합니다**

   - 테스트 후 자동으로 정리되지만, 실제 데이터가 생성됩니다
   - 개발/테스트 전용 버킷을 사용하는 것을 권장합니다

2. **환경 변수 관리**

   - 절대 실제 자격 증명을 Git에 커밋하지 마세요
   - `.env.local`은 `.gitignore`에 포함되어 있습니다

3. **테스트 격리**
   - 통합 테스트는 타임스탬프를 사용하여 폴더 이름을 고유하게 생성합니다
   - 각 테스트 후 `afterEach`에서 자동으로 정리됩니다

## 트러블슈팅

### "getaddrinfo ENOTFOUND" 에러

- 환경 변수가 올바르게 설정되지 않았습니다
- R2_ENDPOINT 값을 확인하세요

### 테스트가 건너뛰어지는 경우

- 환경 변수가 설정되지 않았습니다
- 이는 정상적인 동작입니다 (실제 R2가 없을 때 테스트 실패 방지)

### 정리 실패 에러

- 일부 리소스가 정리되지 않을 수 있습니다
- 수동으로 R2 대시보드에서 `test-integration-*` 폴더를 삭제하세요
