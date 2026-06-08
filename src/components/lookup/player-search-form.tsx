"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlayerSearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string)?.trim();
    router.push(q ? `/lookup?q=${encodeURIComponent(q)}` : "/lookup");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
      <div className="flex-1 space-y-2">
        <Label htmlFor="lookup-q">选手 ID / 昵称</Label>
        <Input
          id="lookup-q"
          name="q"
          defaultValue={defaultQuery}
          placeholder="支持部分匹配，如昵称片段或选手 ID"
        />
      </div>
      <Button type="submit" className="sm:self-end">查询</Button>
    </form>
  );
}
