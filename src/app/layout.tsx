import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "MyDrive - 클라우드 파일 관리",
  description: "안전하고 편리한 클라우드 파일 관리 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${pretendard.variable} antialiased`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
