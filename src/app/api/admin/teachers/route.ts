import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, username: true, name: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ teachers });
}
