import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VoteButtons from "@/components/VoteButtons";
import SignOutButton from "@/components/SignOutButton";

type VoteRow = { vote_value: number; user_id: string };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const sortMode = sort === "top" ? "top" : "newest";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: raw, error } = await supabase
    .from("generations")
    .select("id, generated_text, user_prompt, created_at, votes(vote_value, user_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[feed] query failed:", error.code, error.message);
    return <p>Failed to load feed: {error.message}</p>;
  }

  const generations = (raw ?? []).map((g) => {
    const votes = (g.votes ?? []) as VoteRow[];
    return {
      ...g,
      votes,
      score: votes.reduce((sum, v) => sum + v.vote_value, 0),
      userVote: votes.find((v) => v.user_id === user.id)?.vote_value ?? null,
    };
  });

  if (sortMode === "top") {
    generations.sort((a, b) => b.score - a.score);
  }

  return (
    <main className="page">
      <nav className="nav">
        <a href="/generate">+ Add yours</a>
        <a href="/books">Books</a>
        <a href="/profile">Profile</a>
        <SignOutButton />
      </nav>
      <div className="page-header">
        <h1>NYC Caption Feed</h1>
        <p>Real NYC moments, captioned daily. Vote for the ones that hit.</p>
      </div>

      <div className="sort-controls">
        <a href="/feed" className={sortMode === "newest" ? "sort-active" : ""}>
          Newest
        </a>
        <a href="/feed?sort=top" className={sortMode === "top" ? "sort-active" : ""}>
          Top Rated
        </a>
      </div>

      {generations.length === 0 && (
        <p className="muted">
          The city hasn&apos;t been captioned yet.{" "}
          <a href="/generate">Be the first.</a>
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {generations.map((g) => (
          <li key={g.id} className="feed-item">
            <p className="feed-caption">{g.generated_text}</p>
            <p className="feed-prompt">{g.user_prompt}</p>
            <p className="feed-meta">{new Date(g.created_at).toLocaleString()}</p>
            <VoteButtons
              generationId={g.id}
              score={g.score}
              userVote={g.userVote}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
