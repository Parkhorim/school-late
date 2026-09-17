import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDateRange, kstDateParts, Period } from "@/lib/period";

const VALID_PERIODS: Period[] = ["daily", "weekly", "monthly", "semester", "yearly"];

export async function GET(req: NextRequest) {
  // 대시보드는 로그인 없이 공개되므로, 학생 실명이 담긴 topStudents는
  // 로그인한 사용자에게만 내려준다 (미로그인 시 null).
  const isLoggedIn = (await getSession()) !== null;

  const periodParam = req.nextUrl.searchParams.get("period") ?? "monthly";
  const period = VALID_PERIODS.includes(periodParam as Period)
    ? (periodParam as Period)
    : "monthly";

  const dateParam = req.nextUrl.searchParams.get("date");
  const dateStr = dateParam ?? formatKSTDate(kstDateParts());

  const gradeParam = req.nextUrl.searchParams.get("grade");
  const grade = gradeParam ? Number(gradeParam) : undefined;

  const range = getDateRange(period, dateStr);

  const [records, classes] = await Promise.all([
    prisma.tardyRecord.findMany({
      where: {
        occurredAt: { gte: range.start, lt: range.end },
        ...(grade ? { student: { grade } } : {}),
      },
      select: {
        occurredAt: true,
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            classNo: true,
            numberInClass: true,
          },
        },
      },
    }),
    prisma.student.findMany({
      where: { active: true, ...(grade ? { grade } : {}) },
      select: { grade: true, classNo: true },
      distinct: ["grade", "classNo"],
      orderBy: [{ grade: "asc" }, { classNo: "asc" }],
    }),
  ]);

  const byClassMap = new Map<string, number>();
  for (const c of classes) byClassMap.set(`${c.grade}-${c.classNo}`, 0);

  const bucketMap = new Map<string, number>();
  const useMonthBucket = period === "semester" || period === "yearly";

  const studentCountMap = new Map<
    number,
    { studentId: number; name: string; grade: number; classNo: number; numberInClass: number; count: number }
  >();

  for (const r of records) {
    const key = `${r.student.grade}-${r.student.classNo}`;
    byClassMap.set(key, (byClassMap.get(key) ?? 0) + 1);

    const bucket = useMonthBucket
      ? toKSTBucket(r.occurredAt, "month")
      : toKSTBucket(r.occurredAt, "day");
    bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);

    const existing = studentCountMap.get(r.student.id);
    if (existing) {
      existing.count++;
    } else {
      studentCountMap.set(r.student.id, {
        studentId: r.student.id,
        name: r.student.name,
        grade: r.student.grade,
        classNo: r.student.classNo,
        numberInClass: r.student.numberInClass,
        count: 1,
      });
    }
  }

  const byClass = Array.from(byClassMap.entries())
    .map(([key, count]) => {
      const [g, c] = key.split("-").map(Number);
      return { grade: g, classNo: c, count };
    })
    .sort((a, b) => a.grade - b.grade || a.classNo - b.classNo);

  const byBucket = Array.from(bucketMap.entries())
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => (a.bucket < b.bucket ? -1 : 1));

  const topStudents = Array.from(studentCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    period,
    label: range.label,
    range: { start: range.start, end: range.end },
    totalCount: records.length,
    byClass,
    byBucket,
    topStudents: isLoggedIn ? topStudents : null,
  });
}

function formatKSTDate(p: { y: number; m: number; d: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

function toKSTBucket(date: Date, granularity: "day" | "month") {
  const w = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (granularity === "month") {
    return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}`;
  }
  return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())}`;
}
