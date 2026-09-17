"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "지각 입력" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/admin", label: "학생 명단 관리" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-4xl px-4 pt-2.5 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-bold text-blue-700 min-w-0">
          <img
            src="/logo.png"
            alt=""
            className="w-6 h-6 rounded-full object-contain flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="truncate">문태고 지각기록 시스템</span>
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-full text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 whitespace-nowrap transition-colors flex-shrink-0"
        >
          로그아웃
        </button>
      </div>
      <nav className="mx-auto max-w-4xl px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap border transition-colors ${
              pathname === l.href
                ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
