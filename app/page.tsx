import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="landing">
      <main className="landing-card landing-hero">
        <ThemeToggle />
        <h1>NYC Caption Feed</h1>
        <p className="landing-desc">
          Upload an image and AI turns it into a meme caption written for
          Columbia student life. Every meme lands in a shared feed, where
          students vote on the ones that hit.
        </p>
        <div className="landing-actions">
          <a href="/feed" className="landing-cta landing-cta-primary">
            Explore Posts
          </a>
          <a href="/generate" className="landing-cta">
            Generate a Meme
          </a>
        </div>
        <p className="landing-hint">
          Google sign-in required. New sessions start on the feed.
        </p>
      </main>
    </div>
  );
}
