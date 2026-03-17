import Link from "next/link";
import {
  ArrowRight,
  Receipt,
  PieChart,
  Shield,
  Zap,
  FileText,
  Smartphone,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] text-foreground overflow-hidden">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg font-mono">L</span>
          </div>
          <span className="font-bold text-xl tracking-tight">The Ledger</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#6366f1" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        {/* Decorative background graph + gradient mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Gradient mesh blobs */}
          <div className="absolute -top-20 left-1/3 w-[800px] h-[600px] rounded-full opacity-25 blur-[120px]" style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 70%)" }} />
          <div className="absolute top-40 -right-20 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]" style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 65%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[90px]" style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />

          {/* SVG chart lines — transparent finance graph behind hero */}
          <svg
            className="absolute bottom-0 left-0 w-full h-[70%] opacity-[0.07]"
            viewBox="0 0 1200 500"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Grid lines */}
            {[100, 200, 300, 400].map((y) => (
              <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#6366f1" strokeWidth="1" strokeDasharray="6 6" />
            ))}
            {[0, 150, 300, 450, 600, 750, 900, 1050, 1200].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#6366f1" strokeWidth="1" strokeDasharray="6 6" />
            ))}

            {/* Area chart fill 1 — rising trend */}
            <path
              d="M0 420 C150 380, 250 350, 400 280 C500 230, 600 260, 700 200 C800 150, 900 170, 1000 100 C1100 60, 1150 80, 1200 50 L1200 500 L0 500 Z"
              fill="url(#chartGrad1)"
            />
            {/* Line 1 */}
            <path
              d="M0 420 C150 380, 250 350, 400 280 C500 230, 600 260, 700 200 C800 150, 900 170, 1000 100 C1100 60, 1150 80, 1200 50"
              stroke="#6366f1"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Area chart fill 2 — secondary trend */}
            <path
              d="M0 460 C200 430, 350 420, 500 380 C650 340, 700 370, 850 320 C950 290, 1050 300, 1200 250 L1200 500 L0 500 Z"
              fill="url(#chartGrad2)"
            />
            {/* Line 2 */}
            <path
              d="M0 460 C200 430, 350 420, 500 380 C650 340, 700 370, 850 320 C950 290, 1050 300, 1200 250"
              stroke="#8b5cf6"
              strokeWidth="2"
              fill="none"
            />

            {/* Data points on line 1 */}
            {[
              [0, 420], [400, 280], [700, 200], [1000, 100], [1200, 50],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="5" fill="#6366f1" />
            ))}

            <defs>
              <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-white border border-border/50 shadow-sm text-[13px] font-semibold text-muted-foreground">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Free for students in South Africa
          </div>

          <h1 className="text-[40px] sm:text-[56px] lg:text-[64px] font-bold tracking-tight leading-[1.05] mb-6">
            Track spending.
            <br />
            <span style={{ color: "#6366f1" }}>Invoice parents.</span>
            <br />
            Stay on budget.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mb-10">
            The Ledger is the simplest way for students to log daily expenses,
            categorise purchases, and send clean invoices to parents — all from
            one dashboard.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-white text-[15px] font-bold shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.45)] hover:scale-[1.02] transition-all"
              style={{ backgroundColor: "#6366f1" }}
            >
              Start Tracking — It&apos;s Free
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-border/60 bg-white text-[15px] font-semibold hover:border-primary/40 hover:shadow-md transition-all"
            >
              Sign In
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* Hero visual — abstract feature pills floating over a card */}
        <div className="relative z-10 mt-16 sm:mt-20">
          <div className="bg-white rounded-[2rem] border border-border/40 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 sm:p-12 max-w-4xl mx-auto relative overflow-hidden">
            {/* Background graph watermark */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 600 300" preserveAspectRatio="none" fill="none">
              <path d="M0 250 C100 220,200 180,300 140 C400 100,500 130,600 60" stroke="#6366f1" strokeWidth="2" />
              <path d="M0 280 C150 260,250 230,350 200 C450 170,550 190,600 150" stroke="#8b5cf6" strokeWidth="1.5" />
              {[0, 100, 200, 300, 400, 500, 600].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="4 4" />
              ))}
            </svg>

            <div className="relative z-10">
              {/* Feature pills in a flowing grid */}
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  { label: "Expense Tracking", icon: Receipt, color: "#6366f1" },
                  { label: "Parent Invoices", icon: FileText, color: "#f59e0b" },
                  { label: "Spending Analytics", icon: PieChart, color: "#10b981" },
                  { label: "Mobile-First", icon: Smartphone, color: "#8b5cf6" },
                  { label: "Secure Data", icon: Shield, color: "#ef4444" },
                  { label: "PDF Statements", icon: FileText, color: "#06b6d4" },
                  { label: "Category Tracking", icon: Receipt, color: "#f59e0b" },
                  { label: "Instant Loads", icon: Zap, color: "#10b981" },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-border/30 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pill.color}12` }}
                    >
                      <pill.icon className="w-4 h-4" style={{ color: pill.color }} />
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">{pill.label}</span>
                  </div>
                ))}
              </div>

              {/* Tagline below the pills */}
              <p className="text-center text-muted-foreground text-sm font-medium mt-8">
                Everything you need to manage student finances — in one place.
              </p>
            </div>
          </div>
          {/* Shadow lift */}
          <div className="absolute -bottom-4 left-8 right-8 h-12 rounded-[2rem] bg-white/40 border border-border/20 -z-10 blur-sm" />
        </div>
      </section>

      {/* ── Features section (light) ─────────────────────────── */}
      <section className="relative py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white border-t border-border/30 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Section tag + headline */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 sm:mb-20">
            <div>
              <span className="text-[13px] font-mono font-bold text-foreground/30 tracking-widest uppercase">[ Features ]</span>
              <h2 className="text-[36px] sm:text-[52px] lg:text-[64px] font-bold tracking-tight leading-[1.05] mt-3 text-foreground">
                Everything a<br />
                student <span style={{ color: "#6366f1" }}>needs.</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed lg:text-right">
              From logging a R50 lunch to invoicing your parents R3,000 — we handle the full lifecycle of student spending.
            </p>
          </div>

          {/* Features — editorial staggered layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-14 sm:gap-y-20">
            {[
              {
                num: "01",
                icon: Receipt,
                title: "Expense Logging",
                desc: "Add transactions in seconds — amount, category, date, and whether it's billable to your parents.",
                accent: "#6366f1",
              },
              {
                num: "02",
                icon: FileText,
                title: "Parent Invoices",
                desc: "Select which expenses to bill, generate a clean statement, and share it with a single link.",
                accent: "#f59e0b",
              },
              {
                num: "03",
                icon: PieChart,
                title: "Analytics Dashboard",
                desc: "Interactive charts break down your spending by category, status, and time period.",
                accent: "#10b981",
              },
              {
                num: "04",
                icon: Shield,
                title: "Secure & Private",
                desc: "Encrypted at rest. Only you and your parents (via share links) can see your data.",
                accent: "#ef4444",
              },
              {
                num: "05",
                icon: Smartphone,
                title: "Mobile-First Design",
                desc: "Native-feeling interface designed for phones — log expenses on the go between lectures.",
                accent: "#8b5cf6",
              },
              {
                num: "06",
                icon: Zap,
                title: "Lightning Fast",
                desc: "Built on Next.js 15 with edge functions for sub-second loads on any network.",
                accent: "#06b6d4",
              },
            ].map((f, i) => (
              <div key={f.num} className={`group flex gap-6 ${i % 2 === 1 ? "lg:mt-10" : ""}`}>
                {/* Number + icon */}
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <span className="text-[11px] font-mono font-bold text-foreground/20">{f.num}</span>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-border/30"
                    style={{ backgroundColor: `${f.accent}08`, boxShadow: `0 0 30px ${f.accent}10` }}
                  >
                    <f.icon className="w-6 h-6" style={{ color: f.accent }} />
                  </div>
                  <div className="flex-1 w-px bg-border/30" />
                </div>
                {/* Content */}
                <div className="pt-6">
                  <h3 className="text-[20px] sm:text-[22px] font-bold tracking-tight mb-2 text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — full-width dark ────────────────────── */}
      <section className="relative py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16 sm:mb-20">
            <div>
              <span className="text-[13px] font-mono font-bold text-foreground/30 tracking-widest uppercase">[ How it works ]</span>
              <h2 className="text-[36px] sm:text-[52px] font-bold tracking-tight leading-[1.05] mt-3 text-foreground">
                Three steps.<br />
                <span style={{ color: "#6366f1" }}>Zero friction.</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-md leading-relaxed lg:text-right">
              From your first coffee to month-end invoice — the whole flow takes under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              {
                step: "01",
                title: "Log Expenses",
                desc: "Add each purchase with an amount, category, and date. Toggle 'Bill to Parent' for reimbursable items.",
                accent: "#6366f1",
              },
              {
                step: "02",
                title: "Create a Statement",
                desc: "Select billable transactions and generate a clean, shareable invoice in one click.",
                accent: "#8b5cf6",
              },
              {
                step: "03",
                title: "Share & Get Paid",
                desc: "Send your parents a view-only link. They see the breakdown and mark it paid.",
                accent: "#06b6d4",
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-bold text-lg text-white"
                    style={{ backgroundColor: item.accent }}
                  >
                    {item.step}
                  </div>
                  <div className="flex-1 h-px bg-border/40 group-last:hidden" />
                </div>
                <h3 className="text-[20px] font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────── */}
      <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <div
          className="max-w-6xl mx-auto rounded-[2.5rem] p-10 sm:p-16 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)" }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-15 -translate-y-1/3 translate-x-1/4" style={{ background: "radial-gradient(circle, white, transparent)" }} />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-10 translate-y-1/3 -translate-x-1/4" style={{ background: "radial-gradient(circle, white, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-[28px] sm:text-[44px] font-bold tracking-tight leading-[1.1] mb-4">
                Ready to take control?
              </h2>
              <p className="text-white/75 text-base sm:text-lg leading-relaxed">
                Join students across South Africa who use The Ledger to track spending and get reimbursed faster.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-white font-bold text-[15px] hover:shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap"
                style={{ color: "#6366f1" }}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full border border-white/30 text-white font-bold text-[15px] hover:bg-white/10 transition-all whitespace-nowrap"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 bg-white py-8 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center">
              <span className="text-white font-bold text-sm font-mono">L</span>
            </div>
            <span className="text-sm font-bold text-foreground">The Ledger</span>
          </div>

          <p className="text-[13px] text-muted-foreground font-medium">
            Built by{" "}
            <a
              href="https://kovendan-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground hover:text-primary transition-colors"
            >
              Kovendan Jason Raman
            </a>
          </p>

          <a
            href="https://www.linkedin.com/in/kovendan-raman-2976a422a/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0A66C2]/30 bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-colors"
          >
            <svg className="w-4 h-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span className="text-[13px] font-bold text-[#0A66C2]">LinkedIn</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
