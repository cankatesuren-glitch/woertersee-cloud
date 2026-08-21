import { auth } from "@/auth";
import ProgressDashboard from "./progress-dashboard";
import "./progress-dashboard.css";

const chapters = ["Kapitel 1", "Kapitel 2", "Kapitel 3", "Irregular verbs"];

export default async function Home() {
  const session = await auth();
  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="#">
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
        <div>
          <p className="eyebrow">BUILD A DECK</p>
          <h2>Choose your next chapter.</h2>
        </div>
        <div className="chapters">
          {chapters.map((chapter, index) => (
            <a href="/play" key={chapter}>
              <span>0{index + 1}</span>
              {chapter}
              <b>→</b>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
