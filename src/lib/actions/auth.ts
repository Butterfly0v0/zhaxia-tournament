"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, loginUser } from "@/lib/auth";
import { loginSchema, registerSchema, profileSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth";
import { assertNicknameAvailable } from "@/lib/nickname";
import { encryptSensitiveUserFields } from "@/lib/user-sensitive-fields";

export async function registerAction(formData: FormData) {
  const raw = {
    username: formData.get("username") as string,
    nickname: formData.get("nickname") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return { error: "该用户名已被注册" };
  }

  try {
    await assertNicknameAvailable(parsed.data.nickname);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "该昵称已被使用" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      username: parsed.data.username,
      nickname: parsed.data.nickname,
      passwordHash,
      role: "PLAYER",
    },
  });

  const loginResult = await loginUser(parsed.data.username, parsed.data.password);
  if (!loginResult.ok) {
    return { error: "注册成功但登录失败，请手动登录" };
  }
  redirect("/player");
}

export async function loginAction(formData: FormData) {
  const raw = {
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const loginResult = await loginUser(parsed.data.username, parsed.data.password);
  if (!loginResult.ok) {
    if (loginResult.reason === "banned") {
      return { error: "你的账号已被封禁，如有疑问请联系管理员" };
    }
    return { error: "用户名或密码错误" };
  }

  redirect(loginResult.user.role === "ADMIN" ? "/admin" : "/player");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAuth();

  const raw = {
    nickname: formData.get("nickname") as string,
    email: (formData.get("email") as string) || "",
    qq: (formData.get("qq") as string) || "",
    startGgTag: (formData.get("startGgTag") as string) || "",
    startGgUniqueCode: (formData.get("startGgUniqueCode") as string) || "",
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await assertNicknameAvailable(parsed.data.nickname, user.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "该昵称已被使用" };
  }

  const sensitiveFields = encryptSensitiveUserFields({
    email: parsed.data.email || null,
    qq: parsed.data.qq || null,
    startGgUniqueCode: parsed.data.startGgUniqueCode || null,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      nickname: parsed.data.nickname,
      email: sensitiveFields.email,
      qq: sensitiveFields.qq,
      startGgTag: parsed.data.startGgTag || null,
      startGgUniqueCode: sensitiveFields.startGgUniqueCode,
    },
  });

  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  session.nickname = parsed.data.nickname;
  await session.save();

  return { success: true };
}
