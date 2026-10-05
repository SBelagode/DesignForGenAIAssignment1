import SignInWithGoogle from "@/components/SignInWithGoogle";

export default function Home() {
  return (
    <div className="landing">
      <div className="landing-card">
        <h1>NYC Caption Feed</h1>
        <p className="landing-desc">
          Turn NYC and college-life moments into AI captions, then see what the crowd thinks.
        </p>
        <SignInWithGoogle />
        <p className="landing-hint">Columbia students only — sign in with your Google account.</p>
      </div>
    </div>
  );
}
