"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;

      if (fadeRef.current) clearTimeout(fadeRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      setLoading(false);
      setVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        anchor.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey
      ) return;

      if (href !== pathname) {
        setVisible(true);
        timeoutRef.current = setTimeout(() => setLoading(true), 10);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 bg-[#F4F5FB]/85 dark:bg-[#0f0f14]/85 ${
        loading ? "opacity-100" : "opacity-0"
      }`}
      style={{ backdropFilter: "blur(6px)" }}
    >
      <div className="flex flex-col items-center gap-5">
        {/* Coin animation */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-primary/20"
            style={{ animation: "nav-spin 2.5s linear infinite" }}
          />
          {/* Spinning coin */}
          <div
            className="absolute inset-2 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
              animation: "nav-coin-flip 1.2s ease-in-out infinite",
            }}
          >
            <span className="text-white font-bold text-2xl font-mono select-none">R</span>
          </div>
          {/* Orbiting dot */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-primary"
            style={{
              top: "-3px",
              left: "50%",
              marginLeft: "-5px",
              animation: "nav-orbit 1.5s linear infinite",
              transformOrigin: "5px 43px",
            }}
          />
        </div>

        {/* Text */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground tracking-wide">
            Loading
          </span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-primary/60" style={{ animation: "nav-dot 1.2s ease-in-out 0s infinite" }} />
            <span className="w-1 h-1 rounded-full bg-primary/60" style={{ animation: "nav-dot 1.2s ease-in-out 0.2s infinite" }} />
            <span className="w-1 h-1 rounded-full bg-primary/60" style={{ animation: "nav-dot 1.2s ease-in-out 0.4s infinite" }} />
          </span>
        </div>
      </div>
    </div>
  );
}
