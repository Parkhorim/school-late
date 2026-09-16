import * as XLSX from "xlsx";

export type ParsedStudent = {
  studentNumber: number; // 학번 (예: 2101 = 2학년 1반 1번)
  name: string;
  gender?: string;
};

type HeaderMarker = { idCol: number; nameCol: number; genderCol: number };

/**
 * 학교 학생 명렬 엑셀(반별 블록이 가로로 나열된 형식)을 파싱한다.
 * 헤더가 "학번" 단일 셀이거나, "2025"(구학번) 다음에 "2026"(신학번=학번)이 오는
 * 두 가지 형식을 모두 지원하며, 학번 바로 다음 열을 이름, 그다음 열을 성별로 간주한다.
 * (학번 자체가 학년/반/번호를 담고 있으므로 시트명이나 블록 위치에 의존하지 않는다.)
 */
export function parseRosterWorkbook(buffer: ArrayBuffer | Buffer): ParsedStudent[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const results = new Map<number, ParsedStudent>();

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    for (let r = 0; r < rows.length; r++) {
      const markers = findHeaderMarkers(rows[r]);
      if (markers.length === 0) continue;

      for (const marker of markers) {
        for (let dr = r + 1; dr < rows.length; dr++) {
          const row = rows[dr];
          if (!row) continue;
          const idVal = row[marker.idCol];
          const nameVal = row[marker.nameCol];
          const studentNumber = toValidStudentNumber(idVal);
          const name = typeof nameVal === "string" ? nameVal.trim() : "";
          if (studentNumber === null || !name) continue;

          const genderRaw = row[marker.genderCol];
          const gender =
            typeof genderRaw === "string" && (genderRaw === "남" || genderRaw === "여")
              ? genderRaw
              : undefined;

          results.set(studentNumber, { studentNumber, name, gender });
        }
      }
    }
  }

  return Array.from(results.values()).sort((a, b) => a.studentNumber - b.studentNumber);
}

function findHeaderMarkers(row: unknown[]): HeaderMarker[] {
  const markers: HeaderMarker[] = [];
  for (let j = 0; j < row.length; j++) {
    if (typeof row[j] === "string" && (row[j] as string).trim() === "학번") {
      markers.push({ idCol: j, nameCol: j + 1, genderCol: j + 2 });
    } else if (row[j] === 2025 && row[j + 1] === 2026) {
      markers.push({ idCol: j + 1, nameCol: j + 2, genderCol: j + 3 });
    }
  }
  return markers;
}

function toValidStudentNumber(val: unknown): number | null {
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isInteger(n)) return null;
  if (n < 1000 || n > 9999) return null;
  return n;
}

export function studentNumberToParts(studentNumber: number) {
  return {
    grade: Math.floor(studentNumber / 1000),
    classNo: Math.floor((studentNumber % 1000) / 100),
    numberInClass: studentNumber % 100,
  };
}
