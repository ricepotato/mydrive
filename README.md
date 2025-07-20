# MyDrive - 클라우드 파일 관리 서비스

Google Drive와 같은 웹 드라이브 애플리케이션입니다. 사용자는 파일을 업로드, 다운로드, 미리보기할 수 있으며, Google OAuth를 통한 소셜 로그인을 지원합니다.

## 주요 기능

- 🔐 Google OAuth 소셜 로그인
- 📁 파일 업로드/다운로드
- 👁️ 파일 미리보기 (이미지, PDF, 비디오)
- 🗑️ 파일 삭제
- 📱 반응형 디자인
- ☁️ Cloudflare R2 스토리지

## 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js
- **Storage**: Cloudflare R2 (S3 호환)
- **UI Components**: Lucide React Icons

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

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

### 3. Cloudflare R2 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인
2. R2 Object Storage 서비스 활성화
3. 새 버킷 생성
4. API 토큰 생성 (R2 권한 포함)
5. 위의 환경 변수에 정보 입력

### 4. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 생성
2. OAuth 2.0 클라이언트 ID 생성
3. 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google` 추가
4. 클라이언트 ID와 시크릿을 환경 변수에 설정

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인하세요.

## 사용 방법

### 로그인
1. Google 계정으로 로그인
2. 애플리케이션에 필요한 권한 승인

### 파일 업로드
1. 드래그 앤 드롭으로 파일 업로드
2. 또는 업로드 영역 클릭하여 파일 선택
3. 여러 파일 동시 업로드 가능

### 파일 관리
- **미리보기**: 지원되는 파일 형식 클릭
- **다운로드**: 다운로드 버튼 클릭
- **삭제**: 삭제 버튼 클릭

### 지원 파일 형식

#### 미리보기 지원
- **이미지**: JPG, JPEG, PNG, GIF, WebP, SVG
- **문서**: PDF
- **비디오**: MP4, AVI, MOV, WMV, FLV, WebM

#### 업로드 지원
- 모든 파일 형식 지원

## 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts    # NextAuth 설정
│   │   ├── upload/route.ts                # 파일 업로드 API
│   │   ├── files/route.ts                 # 파일 목록 API
│   │   ├── files/[key]/route.ts           # 파일 삭제 API
│   │   └── download/[key]/route.ts        # 파일 다운로드 API
│   ├── layout.tsx                         # 루트 레이아웃
│   └── page.tsx                           # 메인 페이지
├── components/
│   ├── providers/
│   │   └── NextAuthProvider.tsx           # NextAuth Provider
│   ├── FileUpload.tsx                     # 파일 업로드 컴포넌트
│   ├── FileList.tsx                       # 파일 목록 컴포넌트
│   └── FilePreview.tsx                    # 파일 미리보기 컴포넌트
├── lib/
│   └── r2.ts                              # R2 클라이언트 설정
└── types/
    └── next-auth.d.ts                     # NextAuth 타입 확장
```

## 배포

### Vercel 배포 (권장)

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 환경 변수 설정
4. 배포 완료

### 다른 플랫폼

```bash
npm run build
npm start
```

## 보안 고려사항

- 사용자별 파일 격리 (R2 키 prefix 사용)
- 서명된 URL을 통한 안전한 파일 접근
- OAuth를 통한 안전한 인증
- CORS 설정 확인

## 라이선스

MIT License

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
