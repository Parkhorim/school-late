"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClockIcon, LockIcon } from "@/components/icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      const next = params.get("next") || "/";
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 via-slate-50 to-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl shadow-slate-200/70 ring-1 ring-slate-100 p-7 space-y-5"
      >
        <div className="flex flex-col items-center text-center gap-2 mb-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 overflow-hidden">
            {logoFailed ? (
              <ClockIcon className="w-7 h-7" />
            ) : (
              <img
                src="/logo.png"
                alt=""
                className="w-9 h-9 object-contain"
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900">문태고 지각기록 시스템</h1>
          <p className="text-sm text-slate-500">
            학생부 공용 비밀번호를 입력해 주세요.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">
            비밀번호
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-slate-700">
            입력자 성함 <span className="text-slate-400 font-normal">(선택)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 홍길동"
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-base outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-2.5 font-medium shadow-md shadow-blue-200 disabled:opacity-50 transition-colors"
        >
          {loading ? "확인 중..." : "입장하기"}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
          <LockIcon className="w-3.5 h-3.5" />
          학생 개인정보가 포함되어 있으니 안전하게 관리해 주세요.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
