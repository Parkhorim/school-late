import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const numberStr = req.nextUrl.searchParams.get("number") ?? "";
  const studentNumber = Number(numberStr);

  if (!Number.isInteger(studentNumber) || studentNumber <= 0) {
    return NextResponse.json({ error: "학번을 입력해 주세요." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { studentNumber },
  });

  if (!student || !student.active) {
    return NextResponse.json(
      { error: `학번 ${studentNumber}에 해당하는 학생을 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ student });
}
