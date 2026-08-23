import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/routes";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth;
  const role = user?.user?.role;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isDashboard = pathname.startsWith("/dashboard");
  const isApi = pathname.startsWith("/api");
  const isAuthApi = pathname.startsWith("/api/auth");

  if (!user && isDashboard) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!user && isApi && !isAuthApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user && !canAccessRoute(pathname, role)) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|ico)).*)",
  ],
};
