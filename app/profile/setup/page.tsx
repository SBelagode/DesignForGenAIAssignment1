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
    <main>
      <h1>Complete your profile</h1>
      <ProfileSetupForm />
    </main>
  );
}
