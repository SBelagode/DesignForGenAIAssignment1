import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const credential = formData.get("credential") as string | null;
  const csrfTokenBody = formData.get("g_csrf_token") as string | null;
  const csrfTokenCookie = request.cookies.get("g_csrf_token")?.value;

  if (!credential) {
    return new NextResponse("Missing credential", { status: 400 });
  }

  // GIS sends g_csrf_token in both the POST body and a cookie; they must match.
  if (!csrfTokenBody || !csrfTokenCookie || csrfTokenBody !== csrfTokenCookie) {
    return new NextResponse("CSRF verification failed", { status: 400 });
  }

  const cookieStore = await cookies();

  // Temporary response captures session cookies written by signInWithIdToken.
  // We defer creating the final redirect until we know the destination.
  const tempResponse = NextResponse.redirect(new URL("/books", request.url), {
    status: 303,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            tempResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: authData, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    console.error(
      "[auth/callback] signInWithIdToken failed:",
      error.status,
      error.message
    );
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  // Session is now in memory — query profiles without a separate client.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", authData.user.id)
    .single();

  const isProfileComplete =
    Boolean(profile?.first_name?.trim()) &&
    Boolean(profile?.last_name?.trim());

  if (isProfileComplete) {
    // tempResponse already points to /books and carries the session cookies.
    return tempResponse;
  }

  // Profile is incomplete — redirect to setup, copying session cookies across.
  const setupResponse = NextResponse.redirect(
    new URL("/profile/setup", request.url),
    { status: 303 }
  );
  tempResponse.cookies.getAll().forEach((cookie) =>
    setupResponse.cookies.set(cookie)
  );
  return setupResponse;
}
