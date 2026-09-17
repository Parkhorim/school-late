import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { username } });
  if (!teacher || !(await bcrypt.compare(password, teacher.passwordHash))) {
    return NextResponse.json(
      { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  const token = await createSessionToken({ teacherId: teacher.id, name: teacher.name });
  const res = NextResponse.json({ ok: true, name: teacher.name });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
