import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function findOrCreateVirtualUser(displayName: string) {
  const name = displayName.trim();
  if (!name) throw new Error("选手名称不能为空");

  const existing = await prisma.user.findFirst({
    where: {
      isVirtual: true,
      OR: [{ startGgTag: name }, { nickname: name }],
    },
  });

  if (existing) return existing;

  const suffix = Math.random().toString(36).slice(2, 8);
  const username = `vg_${suffix}_${Date.now().toString(36)}`;

  return prisma.user.create({
    data: {
      username,
      nickname: name,
      startGgTag: name,
      passwordHash: await hashPassword(`virtual_${suffix}`),
      role: "PLAYER",
      isVirtual: true,
    },
  });
}

export async function cleanupVirtualUserIfOrphaned(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.isVirtual) return;

  const [placements, registrations] = await Promise.all([
    prisma.placement.count({ where: { userId } }),
    prisma.registration.count({ where: { userId } }),
  ]);

  if (placements === 0 && registrations === 0) {
    await prisma.user.delete({ where: { id: userId } });
  }
}
