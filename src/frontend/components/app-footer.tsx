import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="w-full border-t border-border/30 bg-white/60 backdrop-blur-sm py-5 px-6">
      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
        {/* Creator credit */}
        <p className="text-[15px] text-muted-foreground font-medium">
          Built by{" "}
          <Link
            href="https://kovendan-portfolio.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-foreground hover:text-primary transition-colors"
          >
            Kovendan Jason Raman
          </Link>
        </p>

        {/* LinkedIn badge */}
        <Link
          href="https://www.linkedin.com/in/kovendan-raman-2976a422a/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#0A66C2]/30 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-colors group"
        >
          <svg
            className="w-5 h-5 text-[#0A66C2] flex-shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="text-[15px] font-bold text-[#0A66C2]">LinkedIn</span>
        </Link>
      </div>
    </footer>
  );
}
