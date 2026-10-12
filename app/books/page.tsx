import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function BooksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author");

  if (error) {
    console.error("[books] query failed:", error.code, error.message);
    return (
      <main className="page">
        <p className="msg-error">Couldn&apos;t load books. Please refresh to try again.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <nav className="nav">
        <a href="/feed">Feed</a>
        <a href="/generate">+ Generate</a>
        <a href="/books" aria-current="page">Books</a>
        <a href="/profile">Profile</a>
        {profile?.first_name && (
          <span className="muted" style={{ marginLeft: "auto" }}>
            Welcome, {profile.first_name}
          </span>
        )}
        <ThemeToggle />
        <SignOutButton />
      </nav>
      <div className="page-header">
        <h1>Books</h1>
      </div>
      <div className="card">
        <ul className="book-list">
          {books.map((book) => (
            <li key={book.id}>
              <strong>{book.title}</strong>
              <span className="muted"> — {book.author}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
