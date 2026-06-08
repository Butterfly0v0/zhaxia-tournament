import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildRegistrationsCsv, sanitizeFilename } from "@/lib/export-registrations";
import { decryptSensitiveUserFields } from "@/lib/user-sensitive-fields";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        tier: true,
        registrations: {
          include: {
            user: {
              select: {
                nickname: true,
                email: true,
                qq: true,
                startGgTag: true,
                startGgUniqueCode: true,
              },
            },
          },
          orderBy: { registeredAt: "asc" },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "赛事不存在" }, { status: 404 });
    }

    const rows = tournament.registrations.map((r) => {
      const user = decryptSensitiveUserFields(r.user);
      return {
        nickname: user.nickname,
        startGgTag: user.startGgTag,
        startGgUniqueCode: user.startGgUniqueCode,
        email: user.email,
        qq: user.qq,
        registeredAt: r.registeredAt,
        status: r.status,
      };
    });

    const csv = buildRegistrationsCsv(tournament, rows);
    const datePart = new Date().toISOString().slice(0, 10);
    const filename = `报名名单-${sanitizeFilename(tournament.title)}-${datePart}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
