"use client";

import { useEffect, useState } from "react";

type Dashboard = {
  summary: {
    exploredWords: number;
    knownWords: number;
    difficultWords: number;
    accuracy: number | null;
    completedGames: number;
    currentStreakDays: number;
    lastPractisedAt: string | null;
  };
  activeGame: { id: string; answeredCards: number; totalCards: number } | null;
  recentGames: {
    id: string;
    type: string;
    completedAt: string;
    totalCards: number;
    accuracy: number | null;
  }[];
  difficultWords: {
    id: string;
    source: "GLOBAL" | "PERSONAL";
    german: string;
    english: string;
  }[];
};

export default function ProgressDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/progress")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setDashboard)
      .catch(() => setError("Your progress is temporarily unavailable."));
  }, []);

  async function practiseDifficult() {
    if (!dashboard?.difficultWords.length) return;
    const global = dashboard.difficultWords
      .filter((word) => word.source === "GLOBAL")
      .map((word) => word.id);
    const personal = dashboard.difficultWords
      .filter((word) => word.source === "PERSONAL")
      .map((word) => word.id);
    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordIds: global,
        personalWordIds: personal,
        cardCount: global.length + personal.length,
        direction: "DE_EN",
        ordering: "RANDOM",
      }),
    });
    const body = await response.json();
    if (response.ok) location.href = `/play?session=${body.id}`;
    else setError(body.detail ?? "Could not start the difficult-word deck.");
  }

  if (error)
    return (
      <p role="alert" className="dashboard-error">
        {error}
      </p>
    );
  if (!dashboard)
    return (
      <section className="dashboard-loading" aria-label="Loading progress">
        Loading your progress…
      </section>
    );
  const { summary } = dashboard;

  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">YOUR PROGRESS</p>
          <h2>Keep the rhythm going.</h2>
          <p>
            {summary.lastPractisedAt
              ? `Last practice ${new Date(summary.lastPractisedAt).toLocaleDateString()}`
              : "Complete your first card to start tracking progress."}
          </p>
        </div>
        {dashboard.activeGame && (
          <a
            className="primary"
            href={`/play?session=${dashboard.activeGame.id}`}
          >
            Resume {dashboard.activeGame.answeredCards}/
            {dashboard.activeGame.totalCards} →
          </a>
        )}
      </div>
      <div className="metric-grid">
        <article>
          <strong>{summary.exploredWords}</strong>
          <span>words explored</span>
        </article>
        <article>
          <strong>{summary.knownWords}</strong>
          <span>known words</span>
        </article>
        <article>
          <strong>{summary.difficultWords}</strong>
          <span>difficult words</span>
        </article>
        <article>
          <strong>
            {summary.accuracy === null
              ? "—"
              : `${summary.accuracy.toFixed(0)}%`}
          </strong>
          <span>overall accuracy</span>
        </article>
        <article>
          <strong>{summary.completedGames}</strong>
          <span>games completed</span>
        </article>
        <article>
          <strong>{summary.currentStreakDays}</strong>
          <span>day streak</span>
        </article>
      </div>
      <div className="dashboard-columns">
        <div>
          <h3>Recent games</h3>
          <div className="recent-list">
            {dashboard.recentGames.map((game) => (
              <a href={`/play?session=${game.id}`} key={game.id}>
                <span>
                  <strong>{game.type.toLowerCase()}</strong>
                  <small>
                    {new Date(game.completedAt).toLocaleDateString()} ·{" "}
                    {game.totalCards} cards
                  </small>
                </span>
                <b>
                  {game.accuracy === null
                    ? "—"
                    : `${game.accuracy.toFixed(0)}%`}
                </b>
              </a>
            ))}
            {!dashboard.recentGames.length && <p>No completed games yet.</p>}
          </div>
        </div>
        <div>
          <h3>Difficult words</h3>
          <div className="difficult-list">
            {dashboard.difficultWords.slice(0, 5).map((word) => (
              <span key={`${word.source}-${word.id}`}>
                <strong>{word.german}</strong>
                <small>{word.english}</small>
              </span>
            ))}
            {!dashboard.difficultWords.length && (
              <p>No difficult words right now.</p>
            )}
          </div>
          <button
            className="secondary"
            disabled={!dashboard.difficultWords.length}
            onClick={practiseDifficult}
          >
            Practise difficult words
          </button>
        </div>
      </div>
    </section>
  );
}
