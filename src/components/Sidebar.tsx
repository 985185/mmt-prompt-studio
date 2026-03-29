"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Studio", icon: "✏️" },
  { href: "/library", label: "Library", icon: "📚" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-mmp-sidebar flex flex-col">
      <div className="px-5 py-6">
        <h1 className="text-white text-lg font-semibold tracking-tight">
          MarkMyPrompt
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">Prompt Studio</p>
      </div>
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                isActive
                  ? "text-white bg-white/5 border-l-2 border-mmp-accent"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-gray-500 text-xs">Test Environment</p>
      </div>
    </aside>
  );
}
