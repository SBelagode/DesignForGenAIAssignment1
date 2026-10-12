import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/ProfileEditForm";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="page">
      <nav className="nav">
        <a href="/feed">Feed</a>
        <a href="/generate">+ Generate</a>
        <a href="/books">Books</a>
        <a href="/profile" aria-current="page">Profile</a>
        <ThemeToggle />
        <SignOutButton />
      </nav>
      <div className="page-header">
        <h1>Profile</h1>
      </div>
      <ProfileEditForm
        userId={user.id}
        firstName={profile?.first_name ?? ""}
        lastName={profile?.last_name ?? ""}
        currentAvatarUrl={profile?.avatar_url ?? null}
      />
    </main>
  );
}
