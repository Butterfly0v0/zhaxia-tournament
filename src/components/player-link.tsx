import Link from "next/link";
import { cn } from "@/lib/utils";

export function PlayerLink({
  userId,
  nickname,
  className,
  variant = "link",
}: {
  userId: string;
  nickname: string;
  className?: string;
  variant?: "link" | "chip";
}) {
  return (
    <Link
      href={`/lookup/${userId}`}
      className={cn(
        variant === "chip"
          ? "rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80 hover:text-primary inline-block"
          : "hover:text-primary hover:underline",
        className
      )}
    >
      {nickname}
    </Link>
  );
}
