// 한국 시간(KST, UTC+9) 기준 날짜/기간 계산 유틸리티.
// 서버는 UTC로 동작할 수 있으므로, 모든 "오늘/이번 주/이번 달" 판단은 KST 기준으로 명시적으로 계산한다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 실제 UTC Date를 KST 벽시계 값이 그대로 담긴 Date로 변환 (getUTC* 메서드로 KST 필드 조회용) */
function toKSTWallDate(date: Date): Date {
  return new Date(date.getTime() + KST_OFFSET_MS);
}

/** KST 벽시계 값(연,월,일,시,분,초)으로부터 실제 UTC Date(Instant)를 생성 */
function fromKSTWall(
  y: number,
  m: number, // 1-12
  d: number,
  hh = 0,
  mm = 0,
  ss = 0
): Date {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - KST_OFFSET_MS);
}

export type KSTDateParts = { y: number; m: number; d: number };

export function kstDateParts(date: Date = new Date()): KSTDateParts {
  const w = toKSTWallDate(date);
  return {
    y: w.getUTCFullYear(),
    m: w.getUTCMonth() + 1,
    d: w.getUTCDate(),
  };
}

/** "YYYY-MM-DD" (KST) -> 그 날짜의 KST 00:00을 나타내는 실제 Date */
export function parseKSTDateOnly(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return fromKSTWall(y, m, d, 0, 0, 0);
}

/** <input type="datetime-local"> 값("YYYY-MM-DDTHH:mm")을 KST 벽시계로 해석해 실제 Date로 변환 */
export function parseKSTLocalInput(s: string): Date {
  const [datePart, timePart] = s.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "0:0").split(":").map(Number);
  return fromKSTWall(y, m, d, hh, mm, 0);
}

/** Date -> KST 기준 "YYYY-MM-DDTHH:mm" (datetime-local input 기본값용) */
export function toKSTLocalInputValue(date: Date = new Date()): string {
  const w = toKSTWallDate(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(
    w.getUTCDate()
  )}T${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}`;
}

export type Period = "daily" | "weekly" | "monthly" | "semester" | "yearly";

export type DateRange = { start: Date; end: Date; label: string };

/**
 * 기준일(refDate, "YYYY-MM-DD" KST)을 포함하는 기간의 [start, end) 범위를 계산.
 * - daily: 해당 일
 * - weekly: 해당 주의 월요일 ~ 다음 월요일 (한국 기준 월요일 시작)
 * - monthly: 해당 월 1일 ~ 다음 달 1일
 * - semester: 1학기(3~8월) / 2학기(9~익년 2월)
 * - yearly: 학년도 기준 3/1 ~ 다음해 3/1
 */
export function getDateRange(period: Period, refDateStr: string): DateRange {
  const [ry, rm, rd] = refDateStr.split("-").map(Number);

  switch (period) {
    case "daily": {
      const start = fromKSTWall(ry, rm, rd);
      const end = fromKSTWall(ry, rm, rd + 1);
      return { start, end, label: `${ry}-${pad2(rm)}-${pad2(rd)}` };
    }
    case "weekly": {
      // 월요일=1 ... 일요일=7 로 변환해 그 주의 월요일 계산
      const refUTCNoon = fromKSTWall(ry, rm, rd, 12, 0, 0);
      const dow = refUTCNoon.getUTCDay() === 0 ? 7 : refUTCNoon.getUTCDay();
      const mondayWall = toKSTWallDate(refUTCNoon);
      mondayWall.setUTCDate(mondayWall.getUTCDate() - (dow - 1));
      const start = fromKSTWall(
        mondayWall.getUTCFullYear(),
        mondayWall.getUTCMonth() + 1,
        mondayWall.getUTCDate()
      );
      const end = fromKSTWall(
        mondayWall.getUTCFullYear(),
        mondayWall.getUTCMonth() + 1,
        mondayWall.getUTCDate() + 7
      );
      return {
        start,
        end,
        label: `${toKSTLocalInputValue(start).slice(0, 10)} 주`,
      };
    }
    case "monthly": {
      const start = fromKSTWall(ry, rm, 1);
      const end = fromKSTWall(rm === 12 ? ry + 1 : ry, rm === 12 ? 1 : rm + 1, 1);
      return { start, end, label: `${ry}년 ${rm}월` };
    }
    case "semester": {
      if (rm >= 3 && rm <= 8) {
        return {
          start: fromKSTWall(ry, 3, 1),
          end: fromKSTWall(ry, 9, 1),
          label: `${ry}학년도 1학기`,
        };
      }
      const startYear = rm >= 9 ? ry : ry - 1;
      return {
        start: fromKSTWall(startYear, 9, 1),
        end: fromKSTWall(startYear + 1, 3, 1),
        label: `${startYear}학년도 2학기`,
      };
    }
    case "yearly": {
      const startYear = rm >= 3 ? ry : ry - 1;
      return {
        start: fromKSTWall(startYear, 3, 1),
        end: fromKSTWall(startYear + 1, 3, 1),
        label: `${startYear}학년도`,
      };
    }
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
