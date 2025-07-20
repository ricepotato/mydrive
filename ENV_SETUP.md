# 환경 변수 설정 가이드

## 1. .env.local 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# R2 설정
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# Google OAuth 설정
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 2. Cloudflare R2 설정

### 2.1 R2 서비스 활성화
1. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인
2. **R2 Object Storage** 서비스 활성화

### 2.2 버킷 생성
1. **R2** → **Manage R2 API tokens** 클릭
2. **Create API token** 클릭
3. **Custom token** 선택
4. 권한 설정:
   - **Object Read & Write** 선택
   - **Bucket**에서 특정 버킷 선택 또는 **All buckets** 선택
5. **Create API Token** 클릭
6. 생성된 **Access Key ID**와 **Secret Access Key** 복사

### 2.3 버킷 생성
1. **R2** → **Buckets** 클릭
2. **Create bucket** 클릭
3. 버킷 이름 입력 (예: `mydrive-files`)
4. **Create bucket** 클릭

### 2.4 환경 변수 설정
생성된 정보를 `.env.local`에 입력:

```env
R2_ACCOUNT_ID=your_account_id  # Cloudflare 대시보드에서 확인
R2_ACCESS_KEY_ID=your_access_key_id  # API 토큰에서 생성된 값
R2_SECRET_ACCESS_KEY=your_secret_access_key  # API 토큰에서 생성된 값
R2_BUCKET_NAME=your_bucket_name  # 생성한 버킷 이름
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

## 3. Google OAuth 설정

### 3.1 Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보** 클릭
4. **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID** 클릭
5. **애플리케이션 유형**: **웹 애플리케이션** 선택
6. **승인된 리디렉션 URI**에 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. **만들기** 클릭
8. 생성된 **클라이언트 ID**와 **클라이언트 시크릿** 복사

### 3.2 환경 변수 설정
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## 4. NextAuth 설정

### 4.1 NEXTAUTH_SECRET 생성
터미널에서 다음 명령어로 시크릿 키 생성:

```bash
openssl rand -base64 32
```

또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

### 4.2 환경 변수 설정
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret_key
```

## 5. 설정 확인

### 5.1 환경 변수 확인
개발 서버를 실행하고 콘솔에서 다음 메시지 확인:
- "R2 환경 변수가 누락되었습니다" 메시지가 없어야 함
- "R2 연결 성공" 메시지가 나타나야 함

### 5.2 테스트
1. `npm run dev` 실행
2. 브라우저에서 `http://localhost:3000` 접속
3. Google 로그인 테스트
4. 파일 업로드 테스트

## 6. 문제 해결

### 6.1 R2 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- R2 API 토큰 권한 확인
- 버킷 이름이 정확한지 확인

### 6.2 Google OAuth 오류
- 리디렉션 URI가 정확한지 확인
- 클라이언트 ID와 시크릿이 올바른지 확인
- OAuth 동의 화면 설정 확인

### 6.3 파일 업로드 오류
- 브라우저 개발자 도구에서 네트워크 탭 확인
- 서버 콘솔에서 오류 메시지 확인
- 파일 크기 제한 확인 (기본 100MB)

## 7. 배포 시 설정

### 7.1 Vercel 배포
1. Vercel 대시보드에서 프로젝트 설정
2. **Environment Variables** 섹션에서 환경 변수 추가
3. `NEXTAUTH_URL`을 프로덕션 URL로 변경

### 7.2 Google OAuth 리디렉션 URI 추가
프로덕션 도메인을 Google OAuth 리디렉션 URI에 추가:
```
https://your-app.vercel.app/api/auth/callback/google
``` 