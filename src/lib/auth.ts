import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "jigak_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 환경변수가 설정되지 않았습니다.");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  teacherId: number;
  name: string; // 선생님 성함
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.teacherId !== "number") return null;
    return {
      teacherId: payload.teacherId,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
