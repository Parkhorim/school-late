import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  const correctPin = process.env.DASHBOARD_PIN;
  if (!correctPin) {
    return NextResponse.json(
      { error: "서버에 DASHBOARD_PIN이 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: pin === correctPin });
}
