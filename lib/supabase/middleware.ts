import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";
import { canAccessRoute, type UserRole } from "@/lib/rbac";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedPaths = ["/app"];
  const authPaths = ["/login", "/signup"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));
  const isAdminPath = pathname.startsWith("/admin");
  const isPortailPublic = pathname === "/portail/login" || pathname.startsWith("/portail/callback");
  const isPortailProtected = pathname.startsWith("/portail") && !isPortailPublic;

  // Portail patient non authentifié → login portail
  if (!user && isPortailProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/portail/login";
    return NextResponse.redirect(url);
  }

  // Staff clinique ne peut pas accéder au portail patient
  if (user && isPortailProtected) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: staffRecord } = await (supabase as any)
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (staffRecord) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Unauthenticated — redirect to login
  if (!user && (isProtected || isAdminPath)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Admin area — require is_super_admin = true
  if (user && isAdminPath) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_super_admin) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // App area — check is_active + role-based access control
  if (user && isProtected) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from("users")
      .select("is_active, role")
      .eq("id", user.id)
      .single();

    if (userData && userData.is_active === false) {
      const url = request.nextUrl.clone();
      url.pathname = "/blocked";
      return NextResponse.redirect(url);
    }

    if (userData && !canAccessRoute(userData.role as UserRole, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/app/dashboard";
    return NextResponse.redirect(url);
  }

  // Patient authentifié sur /portail/login → dashboard portail
  if (user && isPortailPublic && pathname === "/portail/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/portail/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
