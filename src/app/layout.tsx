import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "炸虾格斗会 - 格斗赛事管理",
  description: "炸虾格斗会赛事报名、积分排名与赛事管理平台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} 炸虾格斗会 · 格斗游戏赛事管理平台
        </footer>
      </body>
    </html>
  );
}
