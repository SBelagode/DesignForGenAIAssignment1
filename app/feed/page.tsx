import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VoteButtons from "@/components/VoteButtons";
import CaptionActions from "@/components/CaptionActions";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

type VoteRow = { vote_value: number; user_id: string };

// Feed modes, selected via ?filter=. The first entry is the default.
// To add a mode: add an entry here, then handle its key below.
const FILTERS = [
  { key: "newest", label: "Newest" },
  { key: "top-today", label: "Top Today" },
  { key: "my-upvotes", label: "My Upvotes" },
] as const;

type FeedFilter = (typeof FILTERS)[number]["key"];

function parseFilter(value: string | undefined): FeedFilter {
  return FILTERS.find((f) => f.key === value)?.key ?? FILTERS[0].key;
}

function filterHref(key: FeedFilter): string {
  return key === FILTERS[0].key ? "/feed" : `/feed?filter=${key}`;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const activeFilter = parseFilter(filter);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  let query = supabase
    .from("generations")
    .select("id, generated_text, user_prompt, created_at, votes(vote_value, user_id)");

  if (activeFilter === "top-today") {
    // Current calendar day in the server's timezone — the same zone used to
    // render the timestamps below (toLocaleString on the server).
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query = query.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
  }

  const { data: raw, error } = await query.order("created_at", { ascending: false });

  if (error) {
    console.error("[feed] query failed:", error.code, error.message);
    return (
      <main className="page">
        <p className="msg-error">Couldn&apos;t load the feed. Please refresh to try again.</p>
      </main>
    );
  }

  const scored = (raw ?? []).map((g) => {
    const votes = (g.votes ?? []) as VoteRow[];
    return {
      ...g,
      votes,
      score: votes.reduce((sum, v) => sum + v.vote_value, 0),
      userVote: votes.find((v) => v.user_id === user.id)?.vote_value ?? null,
    };
  });

  // userVote comes from the server-verified user.id above, never from the browser.
  const generations =
    activeFilter === "my-upvotes" ? scored.filter((g) => g.userVote === 1) : scored;

  if (activeFilter === "top-today") {
    generations.sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  return (
    <main className="page">
      <nav className="nav">
        <a href="/feed" aria-current="page">Feed</a>
        <a href="/generate">+ Generate</a>
        <a href="/books">Books</a>
        <a href="/profile">Profile</a>
        <ThemeToggle />
        <SignOutButton />
      </nav>
      <div className="page-header">
        <h1>NYC Caption Feed</h1>
        <p>Real NYC moments, captioned daily. Vote for the ones that hit.</p>
      </div>

      <div className="sort-controls">
        {FILTERS.map((f) => (
          <a
            key={f.key}
            href={filterHref(f.key)}
            className={f.key === activeFilter ? "sort-active" : ""}
            aria-current={f.key === activeFilter ? "page" : undefined}
          >
            {f.label}
          </a>
        ))}
      </div>

      {generations.length === 0 && activeFilter === "my-upvotes" && (
        <p className="muted">
          You haven&apos;t upvoted anything yet.{" "}
          <a href="/feed">Browse the feed</a> and tap ▲ on the ones that hit.
        </p>
      )}

      {generations.length === 0 && activeFilter !== "my-upvotes" && (
        <p className="muted">
          {activeFilter === "top-today"
            ? "Nothing's been captioned today yet. "
            : "The city hasn't been captioned yet. "}
          <a href="/generate">Be the first.</a>
        </p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {generations.map((g) => (
          <li key={g.id} className="feed-item">
            <p className="feed-caption">{g.generated_text}</p>
            <p className="feed-prompt">{g.user_prompt}</p>
            <p className="feed-meta">{new Date(g.created_at).toLocaleString()}</p>
            <div className="feed-actions">
              <VoteButtons
                generationId={g.id}
                score={g.score}
                userVote={g.userVote}
              />
              <CaptionActions text={g.generated_text} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
