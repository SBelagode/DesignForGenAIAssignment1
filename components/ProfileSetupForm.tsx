"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, type ProfileActionState } from "@/app/profile/setup/actions";

export default function ProfileSetupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    saveProfile,
    null
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/books");
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      {state && !state.ok && (
        <p style={{ color: "red" }}>{state.error}</p>
      )}
      <div>
        <label htmlFor="first_name">First name</label>
        <input id="first_name" name="first_name" type="text" required />
      </div>
      <div>
        <label htmlFor="last_name">Last name</label>
        <input id="last_name" name="last_name" type="text" required />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
