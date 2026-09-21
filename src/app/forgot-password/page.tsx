import Link from "next/link";
import { requestPasswordReset } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="w-full max-w-sm card">
        <h1 className="mb-6 page-title">
          Reset your password
        </h1>

        {sent ? (
          <p className="mb-4 banner-success">
            If that email has an account, a reset link is on its way. It expires in 1 hour.
          </p>
        ) : (
          <form action={requestPasswordReset}>
            <label className="label-text">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="mb-6 text-input"
            />
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-ink/70">
          <Link href="/login" className="font-medium text-wave underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
