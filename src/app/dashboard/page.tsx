"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  topStudents: {
    studentId: number;
    name: string;
    grade: number;
    classNo: number;
    numberInClass: number;
    count: number;
  }[];
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, date });
      if (grade !== "all") params.set("grade", grade);
      const res = await fetch(`/api/stats?${params.toString()}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period, date, grade]);

  useEffect(() => {
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
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <section className="bg-white rounded-xl shadow p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                period === p.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="border rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={() => setDate(todayKST())}
            className="text-sm text-blue-600 hover:underline"
          >
            오늘
          </button>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm ml-auto"
          >
            <option value="all">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <h2 className="text-lg font-bold">{stats?.label ?? "-"}</h2>
          <span className="text-3xl font-extrabold text-blue-700">
            {stats?.totalCount ?? 0}
          </span>
          <span className="text-gray-400">건</span>
          {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold mb-3">반별 지각 건수</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="건수" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold mb-3">기간 추이</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bucketChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="건수" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-5">
        <h3 className="font-bold mb-3">지각 많은 학생 Top 10</h3>
        {stats && stats.topStudents.length === 0 && (
          <p className="text-sm text-gray-400">해당 기간 기록이 없습니다.</p>
        )}
        <ul className="divide-y">
          {stats?.topStudents.map((s, i) => (
            <li
              key={s.studentId}
              className="py-2 flex items-center justify-between text-sm"
            >
              <span>
                <span className="text-gray-400 mr-2">{i + 1}</span>
                {s.grade}학년 {s.classNo}반 {s.numberInClass}번 {s.name}
              </span>
              <span className="font-bold text-blue-700">{s.count}회</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
