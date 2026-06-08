import { prisma } from "@/lib/db";

export async function isNicknameTakenByRealUser(
  nickname: string,
  excludeUserId?: string
) {
  const trimmed = nickname.trim();
  if (!trimmed) return false;

  const existing = await prisma.user.findFirst({
    where: {
      nickname: trimmed,
      isVirtual: false,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  return !!existing;
}

export async function assertNicknameAvailable(
  nickname: string,
  excludeUserId?: string
) {
  if (await isNicknameTakenByRealUser(nickname, excludeUserId)) {
    throw new Error("该昵称已被使用，请换一个");
  }
}
