"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartBarIcon, DownloadIcon, LockIcon, UsersIcon } from "@/components/icons";

type Period = "daily" | "weekly" | "monthly" | "semester" | "yearly";

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "일간" },
  { value: "weekly", label: "주간" },
  { value: "monthly", label: "월간" },
  { value: "semester", label: "학기" },
  { value: "yearly", label: "연간" },
];

const PIN_SESSION_KEY = "dashboardPinUnlocked";

type StatsResponse = {
  label: string;
  totalCount: number;
  byClass: { grade: number; classNo: number; count: number }[];
  byBucket: { bucket: string; count: number }[];
  topStudents:
    | {
        studentId: number;
        name: string;
        grade: number;
        classNo: number;
        numberInClass: number;
        count: number;
      }[]
    | null;
};

function todayKST() {
  const w = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${pad(w.getUTCMonth() + 1)}-${pad(w.getUTCDate())}`;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const [date, setDate] = useState(todayKST());
  const [grade, setGrade] = useState<string>("all");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 세션 스토리지는 클라이언트에서만 읽을 수 있어 마운트 시점에 확인
      setPinUnlocked(sessionStorage.getItem(PIN_SESSION_KEY) === "1");
    } catch {
      // 세션 스토리지 접근 불가 시 잠금 상태 유지
    } finally {
      setPinChecked(true);
    }
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ period, date });
    if (grade !== "all") params.set("grade", grade);
    return params.toString();
  }, [period, date, grade]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?${queryString}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 기간/학년 필터가 바뀔 때마다 통계를 다시 불러옴
    load();
  }, [load]);

  const isTeacher = stats ? stats.topStudents !== null : null;
  const showLock = pinChecked && isTeacher === false && !pinUnlocked;

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPinError("");
    setPinSubmitting(true);
    try {
      const res = await fetch("/api/dashboard-pin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.ok) {
        try {
          sessionStorage.setItem(PIN_SESSION_KEY, "1");
        } catch {
          // 세션 스토리지 저장 실패해도 이번 화면은 그대로 unlock 처리
        }
        setPinUnlocked(true);
      } else {
        setPinError("PIN 번호가 올바르지 않습니다.");
      }
    } finally {
      setPinInput("");
      setPinSubmitting(false);
    }
  }

  function handleLockScreen() {
    try {
      sessionStorage.removeItem(PIN_SESSION_KEY);
    } catch {
      // 무시
    }
    setPinUnlocked(false);
  }

  const classChartData =
    stats?.byClass.map((c) => ({
      name: `${c.grade}-${c.classNo}`,
      건수: c.count,
    })) ?? [];

  const bucketChartData =
    stats?.byBucket.map((b) => ({
      name: b.bucket,
      건수: b.count,
    })) ?? [];

  return (
    <div className="relative">
      {showLock && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm px-4">
          <form
            onSubmit={handlePinSubmit}
            className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-6 space-y-4"
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LockIcon className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-slate-900">화면 잠김</h2>
              <p className="text-xs text-slate-500">
                PIN 번호 4자리를 입력해 주세요.
              </p>
            </div>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            />
            {pinError && (
              <p className="text-sm text-red-600 text-center">{pinError}</p>
            )}
            <button
              type="submit"
              disabled={pinSubmitting || pinInput.length !== 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-medium disabled:opacity-50 transition-colors"
            >
              {pinSubmitting ? "확인 중..." : "확인"}
            </button>
          </form>
        </div>
      )}

      {isTeacher === false && pinUnlocked && (
        <button
          onClick={handleLockScreen}
          className="fixed top-4 right-4 z-20 flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-full hover:bg-slate-50 transition-colors"
        >
          <LockIcon className="w-4 h-4" />
          화면 잠그기
        </button>
      )}

      <div className={showLock ? "blur-sm pointer-events-none select-none" : ""}>
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    period === p.value
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
              <button
                onClick={() => setDate(todayKST())}
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                오늘
              </button>

              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm ml-auto outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              >
                <option value="all">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <h2 className="text-lg font-bold text-slate-900">{stats?.label ?? "-"}</h2>
              <span className="text-3xl font-extrabold text-blue-600 tabular-nums">
                {stats?.totalCount ?? 0}
              </span>
              <span className="text-slate-400 text-sm">건</span>
              {loading && <span className="text-xs text-slate-400">불러오는 중...</span>}

              {stats?.topStudents !== null && (
                <a
                  href={`/api/stats/export?${queryString}`}
                  className="ml-auto flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  엑셀 다운로드
                </a>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ChartBarIcon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-slate-900">반별 지각 건수</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
                  <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="건수" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ChartBarIcon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-slate-900">기간 추이</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#94A3B8" tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="건수" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <UsersIcon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-slate-900">지각 많은 학생 Top 10</h3>
            </div>

            {stats?.topStudents === null && (
              <div className="flex flex-col items-center gap-2 text-slate-400 py-8 text-center">
                <LockIcon className="w-7 h-7" />
                <p className="text-sm">
                  개인정보 보호를 위해 로그인한 선생님만 볼 수 있습니다.
                </p>
              </div>
            )}
            {stats?.topStudents?.length === 0 && (
              <p className="text-sm text-slate-400 py-4">해당 기간 기록이 없습니다.</p>
            )}
            {stats?.topStudents && stats.topStudents.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {stats.topStudents.map((s, i) => (
                  <li
                    key={s.studentId}
                    className="py-2.5 flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-slate-800">
                        {s.grade}학년 {s.classNo}반 {s.numberInClass}번 {s.name}
                      </span>
                    </span>
                    <span className="font-bold text-blue-600 tabular-nums">{s.count}회</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
