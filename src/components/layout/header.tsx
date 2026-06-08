import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/logout";
import { Button } from "@/components/ui/button";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src="/images/EbifightClub-logo.png"
            alt="炸虾格斗会 Ebifight Club"
            width={200}
            height={56}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/rankings" className="hover:text-primary transition-colors">
            排行榜
          </Link>
          {user?.role === "PLAYER" && (
            <>
              <Link href="/player/tournaments" className="hover:text-primary transition-colors">
                赛事报名
              </Link>
              <Link href="/player/my-events" className="hover:text-primary transition-colors">
                我的赛事
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-primary transition-colors">
              管理后台
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.nickname}
              </span>
              {user.role === "PLAYER" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/player">个人中心</Link>
                </Button>
              )}
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  退出
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
