import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getDateRange, kstDateParts, toKSTLocalInputValue, Period } from "@/lib/period";

const VALID_PERIODS: Period[] = ["daily", "weekly", "monthly", "semester", "yearly"];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const periodParam = req.nextUrl.searchParams.get("period") ?? "monthly";
  const period = VALID_PERIODS.includes(periodParam as Period)
    ? (periodParam as Period)
    : "monthly";

  const dateParam = req.nextUrl.searchParams.get("date");
  const dateStr = dateParam ?? formatKSTDate(kstDateParts());

  const gradeParam = req.nextUrl.searchParams.get("grade");
  const grade = gradeParam ? Number(gradeParam) : undefined;

  const range = getDateRange(period, dateStr);

  const records = await prisma.tardyRecord.findMany({
    where: {
      occurredAt: { gte: range.start, lt: range.end },
      ...(grade ? { student: { grade } } : {}),
    },
    orderBy: { occurredAt: "asc" },
    include: { student: true },
  });

  const classMap = new Map<string, { 학년: number; 반: number; 건수: number }>();
  const studentMap = new Map<
    number,
    { 학번: number; 이름: string; 학년: number; 반: number; 번호: number; 지각횟수: number }
  >();

  for (const r of records) {
    const classKey = `${r.student.grade}-${r.student.classNo}`;
    const classRow = classMap.get(classKey);
    if (classRow) classRow.건수++;
    else
      classMap.set(classKey, {
        학년: r.student.grade,
        반: r.student.classNo,
        건수: 1,
      });

    const studentRow = studentMap.get(r.student.id);
    if (studentRow) studentRow.지각횟수++;
    else
      studentMap.set(r.student.id, {
        학번: r.student.studentNumber,
        이름: r.student.name,
        학년: r.student.grade,
        반: r.student.classNo,
        번호: r.student.numberInClass,
        지각횟수: 1,
      });
  }

  const classRows = Array.from(classMap.values()).sort(
    (a, b) => a.학년 - b.학년 || a.반 - b.반
  );
  const studentRows = Array.from(studentMap.values()).sort(
    (a, b) => b.지각횟수 - a.지각횟수 || a.학번 - b.학번
  );
  const detailRows = records.map((r) => {
    const [날짜, 시각] = toKSTLocalInputValue(r.occurredAt).split("T");
    return {
      학번: r.student.studentNumber,
      이름: r.student.name,
      학년: r.student.grade,
      반: r.student.classNo,
      번호: r.student.numberInClass,
      날짜,
      시각,
      사유: r.note ?? "",
      입력자: r.recordedBy ?? "",
    };
  });

  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["지각 기록 통계"],
    ["기간", range.label],
    ["총 건수", records.length],
    [],
    ["학년", "반", "건수"],
    ...classRows.map((c) => [c.학년, c.반, c.건수]),
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "요약");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), "학생별 현황");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "상세 기록");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = `지각기록_${range.label}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="export.xlsx"; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`,
    },
  });
}

function formatKSTDate(p: { y: number; m: number; d: number }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}
