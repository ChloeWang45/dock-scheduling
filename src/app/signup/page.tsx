"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "./actions";

const inputClass =
  "mb-4 text-input";
const labelClass = "label-text";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUp, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <form
        action={formAction}
        className="w-full max-w-sm card"
      >
        <h1 className="mb-2 page-title">
          Create an account
        </h1>
        <p className="mb-6 text-sm text-ink/70">
          New accounts need admin approval before you can log in.
        </p>
        {state?.error && (
          <p className="mb-4 banner-error">
            {state.error}
          </p>
        )}

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>First name</label>
            <input name="firstName" type="text" required autoFocus className="text-input" />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input name="lastName" type="text" className="text-input" />
          </div>
        </div>

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
          className="btn-primary w-full"
        >
          {isPending ? "Creating…" : "Create account"}
        </button>
        <p className="mt-4 text-center text-sm text-ink/70">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-wave underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
