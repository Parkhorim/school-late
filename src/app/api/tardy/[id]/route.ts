import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = Number(id);
  if (!Number.isInteger(recordId)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  await prisma.tardyRecord.delete({ where: { id: recordId } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
