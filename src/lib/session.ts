import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  username: string;
  nickname: string;
  role: "PLAYER" | "ADMIN";
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  userId: "",
  username: "",
  nickname: "",
  role: "PLAYER",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "zhaxia_session",
  cookieOptions: {
    // 仅在使用 HTTPS 时启用 Secure；通过 IP + HTTP 访问时需保持 false，否则表单提交会丢失登录态
    secure: process.env.USE_HTTPS === "true",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
