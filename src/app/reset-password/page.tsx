"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { resetPassword } from "./actions";

const inputClass =
  "mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Set a new password
        </h1>

        {!token && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            This link is missing its reset token. Request a new one from the login page.
          </p>
        )}
        {state?.error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
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
          className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Saving…" : "Set new password"}
        </button>
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
