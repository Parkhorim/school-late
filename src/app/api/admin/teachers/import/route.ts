import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseTeacherWorkbook } from "@/lib/teacherParser";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "엑셀 파일을 첨부해 주세요." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let parsed;
  try {
    parsed = parseTeacherWorkbook(buffer);
  } catch {
    return NextResponse.json(
      { error: "엑셀 파일을 읽는 중 오류가 발생했습니다. 형식을 확인해 주세요." },
      { status: 400 }
    );
  }

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "파일에서 계정 정보를 찾지 못했습니다. '성명', '아이디', '비밀번호' 열이 있는지 확인해 주세요." },
      { status: 400 }
    );
  }

  const existing = await prisma.teacher.findMany({
    where: { username: { in: parsed.map((t) => t.username) } },
    select: { username: true },
  });
  const existingSet = new Set(existing.map((e) => e.username));

  for (const t of parsed) {
    const passwordHash = await bcrypt.hash(t.password, 10);
    await prisma.teacher.upsert({
      where: { username: t.username },
      create: { username: t.username, name: t.name, passwordHash },
      update: { name: t.name, passwordHash },
    });
  }

  const created = parsed.filter((t) => !existingSet.has(t.username)).length;
  const updated = parsed.length - created;

  return NextResponse.json({ total: parsed.length, created, updated });
}
