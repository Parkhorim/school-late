"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toKSTLocalInputValue } from "@/lib/period";

type Student = {
  id: number;
  studentNumber: number;
  name: string;
  grade: number;
  classNo: number;
  numberInClass: number;
  gender: string | null;
};

type TardyRecord = {
  id: number;
  occurredAt: string;
  note: string | null;
  recordedBy: string | null;
  student: Student;
};

export default function EntryPage() {
  const [numberInput, setNumberInput] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [occurredAt, setOccurredAt] = useState(toKSTLocalInputValue());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [recent, setRecent] = useState<TardyRecord[]>([]);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const loadRecent = useCallback(async () => {
    const res = await fetch("/api/tardy?limit=20");
    if (res.ok) {
      const data = await res.json();
      setRecent(data.records);
    }
  }, []);

  useEffect(() => {
    loadRecent();
    const interval = setInterval(loadRecent, 8000);
    return () => clearInterval(interval);
  }, [loadRecent]);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError("");
    setSuccessMsg("");
    setStudent(null);
    const n = Number(numberInput);
    if (!Number.isInteger(n) || n <= 0) {
      setLookupError("학번을 정확히 입력해 주세요.");
      return;
    }
    const res = await fetch(`/api/students/lookup?number=${n}`);
    const data = await res.json();
    if (!res.ok) {
      setLookupError(data.error ?? "조회에 실패했습니다.");
      return;
    }
    setStudent(data.student);
    setOccurredAt(toKSTLocalInputValue());
  }

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/tardy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: student.studentNumber,
          occurredAt,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      setSuccessMsg(
        `${student.name} 학생 지각이 기록되었습니다. (오늘 ${data.todayCount}번째, 이번 학기 ${data.semesterCount}번째)`
      );
      setStudent(null);
      setNumberInput("");
      setNote("");
      numberInputRef.current?.focus();
      loadRecent();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/tardy/${id}`, { method: "DELETE" });
    loadRecent();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-bold text-lg mb-3">학생 지각 기록</h2>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            ref={numberInputRef}
            type="number"
            inputMode="numeric"
            placeholder="학번 입력 (예: 2101)"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            autoFocus
            className="flex-1 border rounded-md px-3 py-3 text-lg"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 rounded-md font-medium"
          >
            조회
          </button>
        </form>

        {lookupError && <p className="text-red-600 text-sm mt-2">{lookupError}</p>}
        {successMsg && (
          <p className="text-green-700 bg-green-50 rounded-md px-3 py-2 text-sm mt-3">
            {successMsg}
          </p>
        )}

        {student && (
          <div className="mt-4 border rounded-lg p-4 bg-blue-50">
            <div className="text-xl font-bold">
              {student.grade}학년 {student.classNo}반 {student.numberInClass}번{" "}
              {student.name}
            </div>
            <div className="text-sm text-gray-500 mb-3">
              학번 {student.studentNumber}
              {student.gender ? ` · ${student.gender}` : ""}
            </div>

            <label className="block text-sm font-medium mb-1">지각 시각</label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mb-3"
            />

            <label className="block text-sm font-medium mb-1">
              사유 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 늦잠"
              className="w-full border rounded-md px-3 py-2 mb-4"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white rounded-md py-3 font-bold text-lg disabled:opacity-50"
            >
              {saving ? "저장 중..." : "지각 기록 저장"}
            </button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-5">
        <h2 className="font-bold text-lg mb-3">최근 기록</h2>
        {recent.length === 0 && (
          <p className="text-gray-400 text-sm">아직 기록이 없습니다.</p>
        )}
        <ul className="divide-y">
          {recent.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">
                  {r.student.grade}학년 {r.student.classNo}반 {r.student.numberInClass}번{" "}
                  {r.student.name}
                </span>
                <span className="text-gray-400 ml-2">
                  {new Date(r.occurredAt).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {r.note && <span className="text-gray-400 ml-2">({r.note})</span>}
                {r.recordedBy && (
                  <span className="text-gray-300 ml-2">· {r.recordedBy}</span>
                )}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-gray-400 hover:text-red-600 px-2"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
