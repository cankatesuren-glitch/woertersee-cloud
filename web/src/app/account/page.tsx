import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import AccountClient from "./account-client";
import "../signin/signin.css";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/signin");
  const accountUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/account`;

  return (
    <main className="auth-shell">
      <a className="brand" href="/">
        Wörter<span>See</span>
      </a>
      <section className="auth-card">
        <p className="eyebrow">ACCOUNT</p>
        <h1>{session.user?.name ?? "Your profile"}</h1>
        <p>
          {session.user?.email ??
            "Your identity provider has not shared an email address."}
        </p>
        <AccountClient />
        <a className="primary account-link" href={accountUrl}>
          Manage password and profile
        </a>
        <a className="secondary account-link" href="/settings">
          Learning data settings
        </a>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="secondary">Sign out</button>
        </form>
      </section>
    </main>
  );
}
