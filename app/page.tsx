import SignInWithGoogle from "@/components/SignInWithGoogle";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="landing">
      <div className="landing-card">
        <ThemeToggle />
        <h1>NYC Caption Feed</h1>
        <p className="landing-desc">
          Describe a NYC or college-life moment and AI turns it into a caption.
          Post it to the feed and vote on the best ones.
        </p>
        <div className="landing-signin">
          <SignInWithGoogle />
        </div>
        <p className="landing-hint">Sign in with Google to generate captions and vote.</p>
      </div>
    </div>
  );
}
