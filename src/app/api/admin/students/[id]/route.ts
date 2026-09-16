import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const data: { name?: string; active?: boolean } = {};
  if (typeof body?.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body?.active === "boolean") {
    data.active = body.active;
  }

  const student = await prisma.student.update({ where: { id: studentId }, data });
  return NextResponse.json({ student });
}
