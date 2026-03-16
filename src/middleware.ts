import { auth } from "@/backend/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ── Mock mode: skip all auth checks ──────────────────────────
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const publicRoutes = ["/login", "/signup", "/view"];
  const isPublicRoute = publicRoutes.some((r) => pathname.startsWith(r));

  // Redirect root based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", req.url)
    );
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
