import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "admin" | "staff" | "viewer";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "staff" | "viewer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "staff" | "viewer";
  }
}
