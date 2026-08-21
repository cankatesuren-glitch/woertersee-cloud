import { auth } from "@/auth";
import ProgressDashboard from "./progress-dashboard";
import "./progress-dashboard.css";

export default async function Home() {
  const session = await auth();
  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="/">
          Wörter<span>See</span>
        </a>
        <div className="navlinks">
          <a href="/ai">AI deck studio</a>
          <a href="/words">My words</a>
          <a href="/feedback">Feedback</a>
          <a href="/settings">Settings</a>
          <a href="/play">Play</a>
          <a href={session ? "/account" : "/signin"}>
            {session ? "Account" : "Sign in"}
          </a>
        </div>
      </nav>
      <section className="hero">
        <p className="eyebrow">YOUR DAILY GERMAN PRACTICE</p>
        <h1>
          Words become familiar
          <br />
          <em>one card at a time.</em>
        </h1>
        <p className="lede">
          Build a focused deck, practise what feels difficult and pick up
          exactly where you left off.
        </p>
        <div className="actions">
          <a className="primary" href="/play">
            Continue unseen <b>→</b>
          </a>
          <a className="secondary" href="/play">
            Review difficult
          </a>
        </div>
        {!session && (
          <div className="stats">
            <div>
              <strong>Your words</strong>
              <span>saved to your account</span>
            </div>
            <div>
              <strong>Your pace</strong>
              <span>built around every answer</span>
            </div>
            <div>
              <strong>Your progress</strong>
              <span>available across devices</span>
            </div>
          </div>
        )}
      </section>
      {session && <ProgressDashboard />}
      <section className="deck" id="decks">
        <div className="deck-heading">
          <p className="eyebrow">CHOOSE YOUR ROUTE</p>
          <h2>Start where it feels useful.</h2>
          <p>
            Review what is due, turn a real-life topic into a deck or practise
            words you saved yourself.
          </p>
        </div>
        <div className="route-cards">
          <a className="route-card" href="/play">
            <span>SMART PRACTICE</span>
            <strong>Review today&apos;s words</strong>
            <p>Due cards come first, followed by a manageable set of new words.</p>
            <b>Start practice →</b>
          </a>
          <a className="route-card" href="/ai">
            <span>MAKE A DECK</span>
            <strong>Learn from a topic or PDF</strong>
            <p>Create a draft, check every word and save only the useful ones.</p>
            <b>Open deck studio →</b>
          </a>
          <a className="route-card" href="/words">
            <span>YOUR LIBRARY</span>
            <strong>Practise your own words</strong>
            <p>Return to categories and vocabulary you collected along the way.</p>
            <b>View my words →</b>
          </a>
        </div>
      </section>
    </main>
  );
}
