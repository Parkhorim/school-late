"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toKSTLocalInputValue } from "@/lib/period";
import {
  CheckCircleIcon,
  ClockIcon,
  GraduationCapIcon,
  InboxIcon,
  SearchIcon,
} from "@/components/icons";

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
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  const loadRecent = useCallback(async () => {
    const res = await fetch("/api/tardy?limit=20");
    if (res.ok) {
      const data = await res.json();
      setRecent(data.records);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 진입 시 최근 기록을 불러오고 주기적으로 갱신
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
    if (confirmingId !== id) {
      setConfirmingId(id);
      return;
    }
    setConfirmingId(null);
    await fetch(`/api/tardy/${id}`, { method: "DELETE" });
    loadRecent();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <SearchIcon className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">학생 지각 기록</h2>
        </div>

        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            ref={numberInputRef}
            type="number"
            inputMode="numeric"
            placeholder="학번 입력 (예: 2101)"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
            autoFocus
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-medium transition-colors"
          >
            조회
          </button>
        </form>

        {lookupError && (
          <p className="text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm mt-3">
            {lookupError}
          </p>
        )}
        {successMsg && (
          <p className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2.5 text-sm mt-3">
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </p>
        )}

        {student && (
          <div className="mt-4 border border-blue-100 rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <GraduationCapIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900 leading-tight">
                  {student.grade}학년 {student.classNo}반 {student.numberInClass}번{" "}
                  {student.name}
                </div>
                <div className="text-xs text-slate-500">
                  학번 {student.studentNumber}
                  {student.gender ? ` · ${student.gender}` : ""}
                </div>
              </div>
            </div>

            <label className="block text-sm font-medium mt-4 mb-1.5 text-slate-700">
              지각 시각
            </label>
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 mb-3 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition bg-white"
            />

            <label className="block text-sm font-medium mb-1.5 text-slate-700">
              사유 <span className="text-slate-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 늦잠"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition bg-white"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-3 font-bold text-lg shadow-md shadow-blue-200 disabled:opacity-50 transition-colors"
            >
              {saving ? "저장 중..." : "지각 기록 저장"}
            </button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <ClockIcon className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-lg text-slate-900">최근 기록</h2>
        </div>

        {recent.length === 0 && (
          <div className="flex flex-col items-center gap-2 text-slate-400 py-8">
            <InboxIcon className="w-8 h-8" />
            <p className="text-sm">아직 기록이 없습니다.</p>
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {recent.map((r) => (
            <li key={r.id} className="py-3 flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <span className="font-medium text-slate-900">
                  {r.student.grade}학년 {r.student.classNo}반 {r.student.numberInClass}번{" "}
                  {r.student.name}
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-slate-400">
                  <span>
                    {new Date(r.occurredAt).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {r.note && (
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                      {r.note}
                    </span>
                  )}
                  {r.recordedBy && <span>· {r.recordedBy}</span>}
                </div>
              </div>
              {confirmingId === r.id ? (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-red-600 font-medium px-2 py-1 rounded-md hover:bg-red-50"
                  >
                    정말 삭제
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    className="text-slate-400 px-2 py-1 rounded-md hover:bg-slate-100"
                  >
                    취소
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-slate-300 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md flex-shrink-0 transition-colors"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
