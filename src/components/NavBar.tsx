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
      <nav className="mx-auto max-w-4xl flex items-center gap-1 px-4 py-2.5 overflow-x-auto">
        <span className="flex items-center gap-2 font-bold text-blue-700 mr-3 whitespace-nowrap">
          <img
            src="/logo.png"
            alt=""
            className="w-6 h-6 rounded-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          문태고 지각기록 시스템
        </span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              pathname === l.href
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-auto px-3 py-1.5 rounded-full text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 whitespace-nowrap transition-colors"
        >
          로그아웃
        </button>
      </nav>
    </header>
  );
}
