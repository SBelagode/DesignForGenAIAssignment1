import { createClient } from "@/lib/supabase/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function BooksPage() {
  // SSR client: reads session cookies — used only for identity verification.
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  // Anon client: no session cookies — queries as `anon` role, matching Assignment 2 RLS.
  const anonSupabase = createAnonClient();
  const { data: books, error } = await anonSupabase
    .from("books")
    .select("id, title, author");

  if (error) {
    console.error("[books] query failed:", error.code, error.message);
    return <p>Failed to load books: {error.message}</p>;
  }

  return (
    <main>
      <SignOutButton />
      <h1>Books</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong> — {book.author}
          </li>
        ))}
      </ul>
    </main>
  );
}
