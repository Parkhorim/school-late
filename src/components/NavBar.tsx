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
    <header className="border-b bg-white sticky top-0 z-10">
      <nav className="mx-auto max-w-4xl flex items-center gap-1 px-3 py-2 overflow-x-auto">
        <span className="font-bold text-blue-700 mr-2 whitespace-nowrap">
          지각 기록
        </span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
              pathname === l.href
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-auto px-3 py-1.5 rounded-md text-sm text-gray-500 hover:bg-gray-100 whitespace-nowrap"
        >
          로그아웃
        </button>
      </nav>
    </header>
  );
}
