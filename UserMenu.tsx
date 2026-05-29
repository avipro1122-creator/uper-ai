/**
 * UperAI · UserMenu Component
 * components/UserMenu.tsx
 *
 * Shows Google avatar + name when signed in.
 * Shows "Sign in" button when signed out.
 * Drop-in replacement for the nav's right side.
 */

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
    return <Loader2 size={16} className="text-[#555] animate-spin" />;
  }

  // Signed out
  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="text-xs font-medium px-3.5 py-1.5 rounded-md bg-[#00D4A0]/10 text-[#00D4A0] border border-[#00D4A0]/20 hover:bg-[#00D4A0]/20 transition-colors"
      >
        Sign in with Google
      </button>
    );
  }

  const user = session.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") ?? "U";

  // Signed in
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#222] hover:border-[#2a2a2a] bg-[#111] hover:bg-[#161616] transition-all duration-150"
      >
        {/* Avatar */}
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={22}
            height={22}
            className="rounded-full"
          />
        ) : (
          <div className="w-[22px] h-[22px] rounded-full bg-[#00D4A0]/20 flex items-center justify-center">
            <span className="font-mono text-[10px] text-[#00D4A0] font-medium">
              {initials}
            </span>
          </div>
        )}

        {/* Name (truncated) */}
        <span className="text-xs text-[#888882] max-w-[100px] truncate hidden sm:block">
          {user?.name?.split(" ")[0]}
        </span>
        <ChevronDown
          size={12}
          className={`text-[#555] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[220px] bg-[#111] border border-[#222] rounded-xl overflow-hidden shadow-2xl z-50">
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-[#1a1a1a]">
            <p className="text-xs font-medium text-[#E8E8E4] truncate">{user?.name}</p>
            <p className="text-[11px] text-[#555] truncate mt-0.5 font-mono">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#888882] hover:text-[#E8E8E4] hover:bg-[#161616] transition-colors text-left"
              onClick={() => { setOpen(false); }}
            >
              <User size={13} />
              Profile
            </button>

            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#FF4D4D]/70 hover:text-[#FF4D4D] hover:bg-[#FF4D4D]/5 transition-colors text-left"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
