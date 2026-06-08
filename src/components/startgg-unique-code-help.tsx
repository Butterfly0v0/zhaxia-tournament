import Image from "next/image";

export function StartGgUniqueCodeHelp() {
  return (
    <span className="relative inline-block group">
      <span className="text-xs text-primary cursor-help underline decoration-dotted underline-offset-2">
        如何获取
      </span>
      <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-[min(90vw,420px)] rounded-lg border bg-background p-2 shadow-lg group-hover:block">
        <Image
          src="/images/startgg-unique-code-help.png"
          alt="start.gg 个人资料页中，用户名右侧红框标注处即为唯一代码"
          width={420}
          height={200}
          className="rounded-md w-full h-auto"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          打开 start.gg 个人资料页，用户名右侧的代码即为唯一代码
        </p>
      </div>
    </span>
  );
}
