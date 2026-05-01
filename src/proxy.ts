import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const PROTECTED_PREFIXES = [
  "/assessment",
  "/results",
  "/account",
  "/onboarding",
];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isLoggedIn = !!req.auth?.user;

  if (isProtected && !isLoggedIn) {
    const url = new URL("/signin", nextUrl.origin);
    if (path !== "/signin") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (path === "/signin" || path === "/signup")) {
    return NextResponse.redirect(new URL("/assessment", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
