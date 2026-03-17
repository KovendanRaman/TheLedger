import NextAuth from "next-auth";
import { authConfig } from "@/backend/lib/auth/config";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/view"];
const AUTH_PAGES = ["/login", "/signup"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const isPublicRoute = PUBLIC_ROUTES.some((r) =>
    r === "/" ? pathname === "/" : pathname.startsWith(r)
  );
  const isAuthPage = AUTH_PAGES.some((r) => pathname === r);

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
