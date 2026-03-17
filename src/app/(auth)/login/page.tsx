"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Loader2, BookOpen, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("No account found with that email, or your password is incorrect. Please try again.");
    } else {
      window.location.href = callbackUrl;
    }
  }

  return (
    <div className="w-full max-w-sm relative z-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] gradient-primary glow-primary mb-5 shadow-xl shadow-primary/20">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">The Ledger</h1>
        <p className="text-muted-foreground text-[15px] font-medium mt-1.5">
          Sign in to your account
        </p>
      </div>

      <div className="bg-white rounded-[2rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/50">

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm leading-snug">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@university.ac.za"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="h-14 bg-secondary/30 border-none shadow-sm rounded-xl px-4 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-primary/20"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="h-14 bg-secondary/30 border-none shadow-sm rounded-xl px-4 pr-12 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-primary/20"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-full font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl transition-all gradient-primary mt-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-[15px] font-medium text-muted-foreground mt-6">
          No account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-bold transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-background relative overflow-hidden">
      <div className="absolute top-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-300/10 blur-3xl" />
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
