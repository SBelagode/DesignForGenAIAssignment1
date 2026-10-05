import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GenerateForm from "@/components/GenerateForm";
import SignOutButton from "@/components/SignOutButton";

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <main className="page">
      <nav className="nav">
        <a href="/feed">Feed</a>
        <a href="/books">Books</a>
        <a href="/profile">Profile</a>
        <SignOutButton />
      </nav>
      <div className="page-header">
        <h1>Generate</h1>
        <p>Something always happens out there. Describe it — AI turns it into a caption.</p>
      </div>
      <GenerateForm />
    </main>
  );
}
