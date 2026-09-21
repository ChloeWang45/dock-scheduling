"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "./actions";

const inputClass =
  "mb-4 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Create an account
        </h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          New accounts need admin approval before you can log in.
        </p>
        {state?.error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        <label className={labelClass}>Name</label>
        <input name="name" type="text" required autoFocus className={inputClass} />

        <label className={labelClass}>Title (optional)</label>
        <input
          name="title"
          type="text"
          placeholder="e.g. Dockmaster"
          className={inputClass}
        />

        <label className={labelClass}>Email</label>
        <input name="email" type="email" required className={inputClass} />

        <label className={labelClass}>Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isPending ? "Creating…" : "Create account"}
        </button>
        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-50">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
