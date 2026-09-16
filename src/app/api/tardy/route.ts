import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDateRange, kstDateParts, parseKSTLocalInput } from "@/lib/period";

export async function GET(req: NextRequest) {
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Number.isInteger(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

  const records = await prisma.tardyRecord.findMany({
    orderBy: { recordedAt: "desc" },
    take: limit,
    include: { student: true },
  });

  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json().catch(() => null);

  const studentNumber = Number(body?.studentNumber);
  if (!Number.isInteger(studentNumber) || studentNumber <= 0) {
    return NextResponse.json({ error: "학번이 올바르지 않습니다." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { studentNumber } });
  if (!student || !student.active) {
    return NextResponse.json(
      { error: `학번 ${studentNumber}에 해당하는 학생을 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  const occurredAt =
    typeof body?.occurredAt === "string" && body.occurredAt
      ? parseKSTLocalInput(body.occurredAt)
      : new Date();

  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 200) : null;

  const record = await prisma.tardyRecord.create({
    data: {
      studentId: student.id,
      occurredAt,
      note: note || null,
      recordedBy: session?.name || null,
    },
    include: { student: true },
  });

  const todayRange = getDateRange("daily", formatKSTDate(kstDateParts(occurredAt)));
  const semesterRange = getDateRange("semester", formatKSTDate(kstDateParts(occurredAt)));

  const [todayCount, semesterCount] = await Promise.all([
    prisma.tardyRecord.count({
      where: {
        studentId: student.id,
        occurredAt: { gte: todayRange.start, lt: todayRange.end },
      },
    }),
    prisma.tardyRecord.count({
      where: {
        studentId: student.id,
        occurredAt: { gte: semesterRange.start, lt: semesterRange.end },
      },
    }),
  ]);

  return NextResponse.json({ record, todayCount, semesterCount });
}

function formatKSTDate(p: { y: number; m: number; d: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}
