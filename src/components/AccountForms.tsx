"use client";

import { useActionState } from "react";
import { changePassword, updateProfile, type ActionState } from "@/app/(protected)/account/actions";

const inputClass =
  "text-input";
const labelClass = "label-text";

function Message({ state }: { state: ActionState }) {
  if (!state) return null;
  if (state.error) {
    return (
      <p className="banner-error">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="banner-success">
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
        className="btn-primary"
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
        className="btn-primary"
      >
        {isPending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
