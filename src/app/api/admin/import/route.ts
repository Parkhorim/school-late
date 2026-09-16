import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRosterWorkbook, studentNumberToParts } from "@/lib/rosterParser";

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
    parsed = parseRosterWorkbook(buffer);
  } catch {
    return NextResponse.json(
      { error: "엑셀 파일을 읽는 중 오류가 발생했습니다. 형식을 확인해 주세요." },
      { status: 400 }
    );
  }

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "파일에서 학생 정보를 찾지 못했습니다. '학번' 열이 포함된 명렬표인지 확인해 주세요." },
      { status: 400 }
    );
  }

  const existing = await prisma.student.findMany({
    where: { studentNumber: { in: parsed.map((s) => s.studentNumber) } },
    select: { studentNumber: true },
  });
  const existingSet = new Set(existing.map((e) => e.studentNumber));

  const CHUNK_SIZE = 25;
  for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
    const chunk = parsed.slice(i, i + CHUNK_SIZE);
    await Promise.all(
      chunk.map((s) => {
        const { grade, classNo, numberInClass } = studentNumberToParts(s.studentNumber);
        return prisma.student.upsert({
          where: { studentNumber: s.studentNumber },
          create: {
            studentNumber: s.studentNumber,
            name: s.name,
            grade,
            classNo,
            numberInClass,
            gender: s.gender,
          },
          update: {
            name: s.name,
            grade,
            classNo,
            numberInClass,
            gender: s.gender,
            active: true,
          },
        });
      })
    );
  }

  const created = parsed.filter((s) => !existingSet.has(s.studentNumber)).length;
  const updated = parsed.length - created;

  return NextResponse.json({ total: parsed.length, created, updated });
}
