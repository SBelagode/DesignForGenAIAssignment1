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
  // 303 See Other converts the browser's follow-up request to a GET,
  // implementing the Post-Redirect-Get pattern after a form POST from Google.
  const response = NextResponse.redirect(new URL("/books", request.url), { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  });

  if (error) {
    console.error("[auth/callback] signInWithIdToken failed:", error.status, error.message);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }

  return response;
}
