import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileSetupForm from "@/components/ProfileSetupForm";

export default async function ProfileSetupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <main className="page">
      <div className="page-header">
        <h1>Complete your profile</h1>
        <p>Add your name before exploring the feed.</p>
      </div>
      <ProfileSetupForm />
    </main>
  );
}
