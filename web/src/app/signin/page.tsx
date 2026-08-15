import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import "./signin.css";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await auth()) redirect("/account");

  return (
    <main className="auth-shell">
      <a className="brand" href="/">
        Wörter<span>See</span>
      </a>
      <section className="auth-card">
        <p className="eyebrow">YOUR LEARNING, IN SYNC</p>
        <h1>Welcome to WörterSee.</h1>
        <p>
          Sign in to continue a deck on any device, or create an account for
          your first session.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn(
              "keycloak",
              { redirectTo: "/account" },
              { prompt: "login" },
            );
          }}
        >
          <button className="primary">Sign in</button>
        </form>
        <form
          action={async () => {
            "use server";
            await signIn(
              "keycloak",
              { redirectTo: "/account" },
              { prompt: "create" },
            );
          }}
        >
          <button className="secondary">Create account</button>
        </form>
        <small>
          Forgot your password? Choose “Forgot password” after opening the
          sign-in form.
        </small>
      </section>
    </main>
  );
}
