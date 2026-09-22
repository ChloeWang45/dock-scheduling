"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { resetPassword } from "./actions";
import TopBanner from "@/components/TopBanner";

const inputClass =
  "mb-4 text-input";
const labelClass = "label-text";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, isPending] = useActionState(resetPassword, undefined);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TopBanner />
      <div className="flex flex-1 items-center justify-center">
      <form
        action={formAction}
        className="w-full max-w-sm card"
      >
        <h1 className="mb-6 page-title">
          Set a new password
        </h1>

        {!token && (
          <p className="mb-4 banner-error">
            This link is missing its reset token. Request a new one from the login page.
          </p>
        )}
        {state?.error && (
          <p className="mb-4 banner-error">
            {state.error}
          </p>
        )}

        <input type="hidden" name="token" value={token} />

        <label className={labelClass}>New password</label>
        <input name="password" type="password" required minLength={8} className={inputClass} />

        <label className={labelClass}>Confirm new password</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={isPending || !token}
          className="btn-primary w-full"
        >
          {isPending ? "Saving…" : "Set new password"}
        </button>
        <p className="mt-4 text-center text-sm text-ink/70">
          <Link href="/login" className="font-medium text-wave underline">
            Back to login
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
