"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { registerUser } from "@/backend/actions/auth";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Loader2, BookOpen } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);

    const { error } = await registerUser(fullName, email, password);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    // Auto sign in after successful registration
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      toast.error("Account created — please sign in.");
      router.push("/login");
    } else {
      toast.success("Welcome to The Ledger! 🎉");
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-background relative overflow-hidden">
      <div className="absolute top-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-300/10 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] gradient-primary glow-primary mb-5 shadow-xl shadow-primary/20">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">The Ledger</h1>
          <p className="text-muted-foreground text-[15px] font-medium mt-1.5">
            Create your free account
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-border/50">
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Thabo Ntuli"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-14 bg-secondary/30 border-none shadow-sm rounded-xl px-4 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-primary/20"
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@university.ac.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-secondary/30 border-none shadow-sm rounded-xl px-4 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-primary/20"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-secondary/30 border-none shadow-sm rounded-xl px-4 font-medium text-[15px] focus-visible:ring-2 focus-visible:ring-primary/20"
                required
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-14 rounded-full font-bold text-base shadow-lg shadow-primary/25 hover:shadow-xl transition-all gradient-primary mt-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-[15px] font-medium text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
