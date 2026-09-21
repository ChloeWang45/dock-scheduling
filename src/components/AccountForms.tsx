"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type ActionState } from "@/app/(protected)/account/actions";

const inputClass =
  "w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

function Message({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileForm({ name, title }: { name: string; title: string | null }) {
  const [state, formAction, isPending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Message state={state} />
      <div>
        <label className={labelClass}>Name</label>
        <input name="name" type="text" required defaultValue={name} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Title (optional)</label>
        <input
          name="title"
          type="text"
          placeholder="e.g. Dockmaster"
          defaultValue={title ?? ""}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, undefined);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <Message state={state} />
      <div>
        <label className={labelClass}>Current password</label>
        <input name="currentPassword" type="password" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>New password</label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Confirm new password</label>
        <input
          name="confirmNewPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
