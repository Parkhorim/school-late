"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SearchIcon, UploadIcon, UsersIcon } from "@/components/icons";

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

type Teacher = {
  id: number;
  username: string;
  name: string;
};

export default function AdminPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherUploading, setTeacherUploading] = useState(false);
  const [teacherUploadMsg, setTeacherUploadMsg] = useState("");
  const [teacherUploadError, setTeacherUploadError] = useState("");
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  const loadStudents = useCallback(async (q: string) => {
    const res = await fetch(`/api/admin/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) {
      const data = await res.json();
      setStudents(data.students);
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    const res = await fetch("/api/admin/teachers");
    if (res.ok) {
      const data = await res.json();
      setTeachers(data.teachers);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 진입 시 학생/교사 목록을 불러옴
    loadStudents("");
    loadTeachers();
  }, [loadStudents, loadTeachers]);

  async function handleTeacherUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTeacherUploading(true);
    setTeacherUploadMsg("");
    setTeacherUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/teachers/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setTeacherUploadError(data.error ?? "업로드에 실패했습니다.");
        return;
      }
      setTeacherUploadMsg(
        `총 ${data.total}명 처리 (신규 ${data.created}명, 갱신 ${data.updated}명)`
      );
      loadTeachers();
    } finally {
      setTeacherUploading(false);
      if (teacherFileInputRef.current) teacherFileInputRef.current.value = "";
    }
  }

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
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UploadIcon className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">학생 명단 업로드</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          학교 학생 명렬 엑셀 파일(.xlsx)을 업로드하면 학번을 기준으로 자동
          등록/갱신됩니다. 반별로 여러 번 나눠 올려도 되고, 전체 파일을 한 번에
          올려도 됩니다.
        </p>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-sm text-slate-500 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
          <UploadIcon className="w-4 h-4" />
          <span>{uploading ? "업로드 중..." : "엑셀 파일 선택 또는 끌어놓기"}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploadMsg && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-3">
            {uploadMsg}
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
            {uploadError}
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <UsersIcon className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">학생 목록 ({students.length}명)</h2>
        </div>
        <div className="relative mb-4">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="학번 또는 이름 검색"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              loadStudents(e.target.value);
            }}
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                <th className="py-2.5 px-3">학번</th>
                <th className="py-2.5 px-3">이름</th>
                <th className="py-2.5 px-3">학년/반/번호</th>
                <th className="py-2.5 px-3">성별</th>
                <th className="py-2.5 px-3">상태</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-t border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : ""} ${!s.active ? "text-slate-300" : "text-slate-700"}`}
                >
                  <td className="py-2 px-3 tabular-nums">{s.studentNumber}</td>
                  <td className="py-2 px-3 font-medium">{s.name}</td>
                  <td className="py-2 px-3 tabular-nums">
                    {s.grade}-{s.classNo}-{s.numberInClass}
                  </td>
                  <td className="py-2 px-3">{s.gender ?? "-"}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {s.active ? "재학" : "비활성"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => toggleActive(s)}
                      className="text-blue-600 hover:underline text-xs font-medium"
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

      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UploadIcon className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">교사 계정 업로드</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          &quot;성명&quot;, &quot;아이디&quot;, &quot;비밀번호&quot; 열이 있는 엑셀
          파일을 업로드하면 아이디를 기준으로 계정이 자동 등록/갱신됩니다.
        </p>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 text-sm text-slate-500 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
          <UploadIcon className="w-4 h-4" />
          <span>{teacherUploading ? "업로드 중..." : "엑셀 파일 선택 또는 끌어놓기"}</span>
          <input
            ref={teacherFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleTeacherUpload}
            disabled={teacherUploading}
            className="hidden"
          />
        </label>
        {teacherUploadMsg && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 mt-3">
            {teacherUploadMsg}
          </p>
        )}
        {teacherUploadError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">
            {teacherUploadError}
          </p>
        )}

        <h3 className="font-semibold text-slate-700 mt-6 mb-3 text-sm">
          등록된 계정 ({teachers.length}명)
        </h3>
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-left text-slate-400 text-xs uppercase tracking-wide">
                <th className="py-2 px-3">성명</th>
                <th className="py-2 px-3">아이디</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, i) => (
                <tr
                  key={t.id}
                  className={`border-t border-slate-100 ${i % 2 === 1 ? "bg-slate-50/50" : ""}`}
                >
                  <td className="py-1.5 px-3 font-medium text-slate-700">{t.name}</td>
                  <td className="py-1.5 px-3 text-slate-500">{t.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
