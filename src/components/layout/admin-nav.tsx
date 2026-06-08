"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/games", label: "游戏管理" },
  { href: "/admin/tiers", label: "等级与积分" },
  { href: "/admin/tournaments", label: "赛事管理" },
  { href: "/admin/users", label: "用户管理" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4 mb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
