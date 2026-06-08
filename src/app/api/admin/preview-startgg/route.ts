import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { previewStartGgFromUrl } from "@/lib/startgg-sync";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { startGgUrl, eventId, multiEvent } = await request.json();

    if (!startGgUrl) {
      return NextResponse.json({ error: "请提供 start.gg 链接" }, { status: 400 });
    }

    const result = await previewStartGgFromUrl(startGgUrl, eventId || null, {
      multiEvent: !!multiEvent,
    });
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "拉取失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
