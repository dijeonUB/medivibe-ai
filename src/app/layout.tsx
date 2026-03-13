import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MediVibe AI — 유비케어 AI 의료 정보 도우미",
  description: "Claude AI 기반 의료 용어 설명 및 건강 Q&A 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
