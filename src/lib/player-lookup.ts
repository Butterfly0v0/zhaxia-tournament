import { prisma } from "@/lib/db";
import { decryptSensitiveUserFields } from "@/lib/user-sensitive-fields";

export async function searchPlayers(query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.user.findMany({
    where: {
      role: "PLAYER",
      isBanned: false,
      OR: [
        { nickname: { contains: q } },
        { id: { contains: q } },
        { startGgTag: { contains: q } },
      ],
    },
    select: {
      id: true,
      nickname: true,
      isVirtual: true,
    },
    orderBy: [{ isVirtual: "asc" }, { nickname: "asc" }],
    take: 30,
  });
}

export async function getPlayerForPublicLookup(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nickname: true,
      username: true,
      startGgTag: true,
      startGgUniqueCode: true,
      isVirtual: true,
      isBanned: true,
      role: true,
    },
  });

  if (!user || user.isBanned || user.role !== "PLAYER") return null;

  const decrypted = decryptSensitiveUserFields(user);
  return {
    id: decrypted.id,
    nickname: decrypted.nickname,
    username: decrypted.username,
    startGgTag: decrypted.startGgTag,
    startGgUniqueCode: decrypted.startGgUniqueCode,
    isVirtual: decrypted.isVirtual,
  };
}

export function getStartGgProfileUrl(uniqueCode: string | null | undefined) {
  if (!uniqueCode?.trim()) return null;
  return `https://www.start.gg/user/${uniqueCode.trim()}`;
}
