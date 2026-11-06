import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/feed");

  return (
    <div className="landing">
      <main className="landing-card">
        <ThemeToggle />
        <h1>Sign in to continue</h1>
        <p className="landing-desc">
          Sign in with Google to explore posts, generate captions, and vote.
        </p>
        {error && (
          <p className="msg-error" role="alert">
            Sign-in didn&apos;t work. Please try again.
          </p>
        )}
        <div className="landing-signin">
          <SignInWithGoogle />
        </div>
        <p className="landing-hint">
          <a href="/">Back to home</a>
        </p>
      </main>
    </div>
  );
}
