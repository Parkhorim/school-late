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
  );
}
