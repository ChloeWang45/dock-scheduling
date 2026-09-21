import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; signedUp?: string; reset?: string }>;
}) {
  const { error, signedUp, reset } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/berths",
      });
    } catch (err) {
      if (err instanceof CredentialsSignin && err.code === "account_pending") {
        redirect("/login?error=account_pending");
      }
      if (err instanceof AuthError) {
        redirect("/login?error=invalid_credentials");
      }
      throw err;
    }
  }

  const errorMessage =
    error === "account_pending"
      ? "This account is pending admin approval."
      : error
        ? "Invalid email or password."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <form
        action={login}
        className="w-full max-w-sm card"
      >
        <h1 className="mb-6 page-title">
          Dock Scheduling
        </h1>
        {signedUp && (
          <p className="mb-4 banner-success">
            Account created. An admin needs to approve it before you can log in.
          </p>
        )}
        {reset && (
          <p className="mb-4 banner-success">
            Password updated. Log in with your new password.
          </p>
        )}
        {errorMessage && (
          <p className="mb-4 banner-error">
            {errorMessage}
          </p>
        )}
        <label className="label-text">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="mb-4 text-input"
        />
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink/80">Password</label>
          <Link
            href="/forgot-password"
            className="muted-link"
          >
            Forgot password?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          required
          className="mb-6 text-input"
        />
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Log in
        </button>
        <p className="mt-4 text-center text-sm text-ink/70">
          No account?{" "}
          <Link href="/signup" className="font-medium text-wave underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
