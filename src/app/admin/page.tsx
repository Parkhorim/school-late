"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Student = {
  id: number;
  studentNumber: number;
  name: string;
  grade: number;
  classNo: number;
  numberInClass: number;
  gender: string | null;
  active: boolean;
};

export default function AdminPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");

  const loadStudents = useCallback(async (q: string) => {
    const res = await fetch(`/api/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 진입 시 학생 목록을 불러옴
    loadStudents("");
  }, [loadStudents]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setUploadMsg(
        `총 ${data.total}명 처리 (신규 ${data.created}명, 갱신 ${data.updated}명)`
      );
      loadStudents(query);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function toggleActive(s: Student) {
    await fetch(`/api/admin/students/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    loadStudents(query);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-bold text-lg mb-2">학생 명단 업로드</h2>
        <p className="text-sm text-gray-500 mb-3">
          학교 학생 명렬 엑셀 파일(.xlsx)을 업로드하면 학번을 기준으로 자동
          등록/갱신됩니다. 반별로 여러 번 나눠 올려도 되고, 전체 파일을 한 번에
          올려도 됩니다.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm border rounded-md p-2"
        />
        {uploading && <p className="text-sm text-gray-500 mt-2">업로드 중...</p>}
        {uploadMsg && <p className="text-sm text-green-700 mt-2">{uploadMsg}</p>}
        {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">학생 목록 ({students.length}명)</h2>
        </div>
        <input
          type="text"
          placeholder="학번 또는 이름 검색"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            loadStudents(e.target.value);
          }}
          className="w-full border rounded-md px-3 py-2 mb-3"
        />
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-2">학번</th>
                <th className="py-2 pr-2">이름</th>
                <th className="py-2 pr-2">학년/반/번호</th>
                <th className="py-2 pr-2">성별</th>
                <th className="py-2 pr-2">상태</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className={`border-b ${!s.active ? "text-gray-300" : ""}`}>
                  <td className="py-1.5 pr-2">{s.studentNumber}</td>
                  <td className="py-1.5 pr-2">{s.name}</td>
                  <td className="py-1.5 pr-2">
                    {s.grade}-{s.classNo}-{s.numberInClass}
                  </td>
                  <td className="py-1.5 pr-2">{s.gender ?? "-"}</td>
                  <td className="py-1.5 pr-2">{s.active ? "재학" : "비활성"}</td>
                  <td className="py-1.5">
                    <button
                      onClick={() => toggleActive(s)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      {s.active ? "비활성화" : "재활성화"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
