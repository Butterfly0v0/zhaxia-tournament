import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function deactivateAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { placements: true } } },
  });

  if (!user) throw new Error("用户不存在");
  if (user.role === "ADMIN") throw new Error("管理员账号不可注销");
  if (user.isVirtual) throw new Error("该账号已注销");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("密码错误");

  await prisma.registration.updateMany({
    where: { userId, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED" },
  });

  if (user._count.placements > 0) {
    const suffix = Math.random().toString(36).slice(2, 8);
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVirtual: true,
        username: `vd_${suffix}_${Date.now().toString(36)}`,
        passwordHash: await hashPassword(`deactivated_${suffix}_${Date.now()}`),
        email: null,
        qq: null,
        startGgUniqueCode: null,
      },
    });
    return { mode: "virtualized" as const, placementCount: user._count.placements };
  }

  await prisma.user.delete({ where: { id: userId } });
  return { mode: "deleted" as const, placementCount: 0 };
}
