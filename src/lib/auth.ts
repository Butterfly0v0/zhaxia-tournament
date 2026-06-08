import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "./db";
import { getSession } from "./session";
import { decryptSensitiveUserFields } from "./user-sensitive-fields";

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: "invalid_credentials" | "banned" };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      nickname: true,
      email: true,
      qq: true,
      startGgTag: true,
      startGgUniqueCode: true,
      role: true,
      isVirtual: true,
      isBanned: true,
      createdAt: true,
    },
  });

  if (!user || user.isBanned || user.isVirtual) return null;
  return decryptSensitiveUserFields(user);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.isVirtual) {
    return { ok: false, reason: "invalid_credentials" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false, reason: "invalid_credentials" };
  }

  if (user.isBanned) {
    return { ok: false, reason: "banned" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.nickname = user.nickname;
  session.role = user.role;
  session.isLoggedIn = true;
  await session.save();

  return { ok: true, user };
}

export async function logoutUser() {
  const session = await getSession();
  session.destroy();
}
