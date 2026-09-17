import * as XLSX from "xlsx";

export type ParsedTeacher = {
  username: string;
  name: string;
  password: string;
};

/**
 * 선생님 계정 엑셀을 파싱한다. "성명", "아이디", "비밀번호" 헤더가 있는
 * 행을 찾아 그 아래 데이터를 읽는다. 시트/열 위치에 의존하지 않는다.
 */
export function parseTeacherWorkbook(buffer: ArrayBuffer | Buffer): ParsedTeacher[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const results = new Map<string, ParsedTeacher>();

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const nameCol = row.findIndex((c) => typeof c === "string" && c.trim() === "성명");
      const idCol = row.findIndex((c) => typeof c === "string" && c.trim() === "아이디");
      const pwCol = row.findIndex(
        (c) => typeof c === "string" && c.trim() === "비밀번호"
      );
      if (nameCol === -1 || idCol === -1 || pwCol === -1) continue;

      for (let dr = r + 1; dr < rows.length; dr++) {
        const drow = rows[dr];
        if (!drow) continue;
        const name = typeof drow[nameCol] === "string" ? drow[nameCol].trim() : "";
        const username =
          typeof drow[idCol] === "string" ? drow[idCol].trim() : String(drow[idCol] ?? "").trim();
        const password =
          typeof drow[pwCol] === "string" ? drow[pwCol].trim() : String(drow[pwCol] ?? "").trim();
        if (!name || !username || !password) continue;

        results.set(username, { username, name, password });
      }
    }
  }

  return Array.from(results.values());
}
