import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const students = await prisma.student.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            ...(Number.isInteger(Number(q))
              ? [{ studentNumber: Number(q) }]
              : []),
          ],
        }
      : undefined,
    orderBy: [{ grade: "asc" }, { classNo: "asc" }, { numberInClass: "asc" }],
  });

  return NextResponse.json({ students });
}
