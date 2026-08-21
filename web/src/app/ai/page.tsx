import { auth, signIn } from "@/auth";
import AiDeckStudio from "./studio";
import "./studio.css";
import "./pdf-studio.css";

export const dynamic = "force-dynamic";

export default async function AiDeckPage() {
  const session = await auth();
  if (!session) {
    return (
      <main className="ai-signin">
        <p className="eyebrow">AI DECK STUDIO</p>
        <h1>Sign in to build a vocabulary deck.</h1>
        <form
          action={async () => {
            "use server";
            await signIn("keycloak", { redirectTo: "/ai" });
          }}
        >
          <button className="primary">Sign in</button>
        </form>
      </main>
    );
  }
  return <AiDeckStudio />;
}
