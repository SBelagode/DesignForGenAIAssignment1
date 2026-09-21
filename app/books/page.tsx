import { supabase } from "@/lib/supabase";

export default async function BooksPage() {
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author");

  if (error) {
    return <p>Failed to load books: {error.message}</p>;
  }

  return (
    <main>
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
