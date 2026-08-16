"use client";

import { useEffect, useState } from "react";
import type { components, operations } from "@/lib/api/schema";

type Dashboard = components["schemas"]["ProgressDashboard"];
type DailyGoalRequest = operations["updateDailyGoal"]["requestBody"]["content"]["application/json"];

export default function ProgressDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [activityPeriod, setActivityPeriod] = useState<7 | 30>(7);
  const [savingGoal, setSavingGoal] = useState(false);

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
    const difficultWords = dashboard?.difficultWords ?? [];
    if (!difficultWords.length) return;
    const global = difficultWords
      .filter((word) => word.source === "GLOBAL")
      .map((word) => word.id)
      .filter((id): id is string => Boolean(id));
    const personal = difficultWords
      .filter((word) => word.source === "PERSONAL")
      .map((word) => word.id)
      .filter((id): id is string => Boolean(id));
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

  async function updateDailyGoal(games: number) {
    if (!dashboard) return;
    setSavingGoal(true);
    setError("");
    try {
      const response = await fetch("/api/profile/learning-goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games } satisfies DailyGoalRequest),
      });
      if (!response.ok) throw new Error();
      setDashboard({
        ...dashboard,
        dailyGoal: { ...dashboard.dailyGoal, targetGames: games },
      });
    } catch {
      setError("Could not save your daily goal.");
    } finally {
      setSavingGoal(false);
    }
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
  const summary = dashboard.summary;
  const periodDays = (dashboard.activity?.days ?? [])
    .filter((day): day is typeof day & { date: string } => Boolean(day.date))
    .slice(-activityPeriod);
  const firstActiveDay = periodDays.findIndex(
    (day) => (day.gamesStarted ?? 0) > 0 || (day.gamesCompleted ?? 0) > 0,
  );
  const activityDays =
    firstActiveDay < 0 ? periodDays.slice(-1) : periodDays.slice(firstActiveDay);
  const difficultWords = dashboard.difficultWords ?? [];
  const recentGames = dashboard.recentGames ?? [];
  const dailyGoal = dashboard.dailyGoal;
  const activityStarted = activityDays.reduce(
    (total, day) => total + (day.gamesStarted ?? 0),
    0,
  );
  const activityCompleted = activityDays.reduce(
    (total, day) => total + (day.gamesCompleted ?? 0),
    0,
  );

  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">YOUR PROGRESS</p>
          <h2>Keep the rhythm going.</h2>
          <p>
            {summary?.lastPractisedAt
              ? `Last practice ${new Date(summary.lastPractisedAt).toLocaleDateString()}`
              : "Complete your first card to start tracking progress."}
          </p>
        </div>
        {dashboard.activeGame?.id && (
          <a
            className="primary"
            href={`/play?session=${dashboard.activeGame.id}`}
          >
            Resume {dashboard.activeGame.answeredCards ?? 0}/
            {dashboard.activeGame.totalCards ?? 0} →
          </a>
        )}
      </div>
      <div className="metric-grid">
        <article>
          <strong>{summary?.exploredWords ?? 0}</strong>
          <span>words explored</span>
        </article>
        <article>
          <strong>{summary?.knownWords ?? 0}</strong>
          <span>known words</span>
        </article>
        <article>
          <strong>{summary?.difficultWords ?? 0}</strong>
          <span>difficult words</span>
        </article>
        <article>
          <strong>
            {summary?.accuracy == null
              ? "—"
              : `${summary.accuracy.toFixed(0)}%`}
          </strong>
          <span>overall accuracy</span>
        </article>
        <article>
          <strong>{summary?.completedGames ?? 0}</strong>
          <span>games completed</span>
        </article>
        <article>
          <strong>{summary?.currentStreakDays ?? 0}</strong>
          <span>day streak</span>
        </article>
      </div>
      <section className="activity-panel" aria-labelledby="activity-title">
        <div className="activity-heading">
          <div>
            <p className="eyebrow">LEARNING ACTIVITY</p>
            <h3 id="activity-title">Your practice rhythm</h3>
            <p>
              {activityStarted} games started · {activityCompleted} completed
            </p>
          </div>
          <div className="activity-period" aria-label="Activity period">
            {[7, 30].map((period) => (
              <button
                aria-pressed={activityPeriod === period}
                className={activityPeriod === period ? "selected" : ""}
                key={period}
                onClick={() => setActivityPeriod(period as 7 | 30)}
                type="button"
              >
                {period} days
              </button>
            ))}
          </div>
        </div>
        <div className={`daily-goal ${dailyGoal?.achieved ? "achieved" : ""}`}>
          <div>
            <strong>{dailyGoal?.achieved ? "Daily goal complete" : "Today’s goal"}</strong>
            <span>
              {dailyGoal?.completedGames ?? 0} of {dailyGoal?.targetGames ?? 1} games completed
            </span>
          </div>
          <div className="goal-progress" aria-label={`${dailyGoal?.percentage ?? 0}% of daily goal`}>
            <span style={{ width: `${dailyGoal?.percentage ?? 0}%` }} />
          </div>
          <label>
            Goal
            <select
              aria-label="Daily game goal"
              disabled={savingGoal}
              onChange={(event) => updateDailyGoal(Number(event.target.value))}
              value={dailyGoal?.targetGames ?? 1}
            >
              {[1, 2, 3, 5, 10].map((games) => (
                <option key={games} value={games}>{games} {games === 1 ? "game" : "games"}</option>
              ))}
            </select>
          </label>
        </div>
        <div
          className={`activity-rhythm ${activityPeriod === 30 ? "compact" : ""}`}
          aria-label={`${activityPeriod} day game activity`}
        >
          {activityDays.map((day) => (
            <div
              className={`rhythm-day ${(day.gamesCompleted ?? 0) > 0 ? "practised" : "rest"}`}
              key={day.date}
            >
              <time dateTime={day.date}>
                {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </time>
              <strong>{day.gamesCompleted ?? 0}</strong>
              <small>{(day.gamesCompleted ?? 0) === 1 ? "session" : "sessions"}</small>
              <span className="rhythm-mark" aria-hidden="true" />
              <span className="sr-only">
                {day.gamesStarted ?? 0} started, {day.gamesCompleted ?? 0} completed
              </span>
            </div>
          ))}
        </div>
        <p className="activity-caption">
          Showing your rhythm from your first practice day through today.
        </p>
      </section>
      <div className="dashboard-columns">
        <div>
          <h3>Recent games</h3>
          <div className="recent-list">
            {recentGames.map((game) => (
              <a href={`/play?session=${game.id}`} key={game.id ?? game.completedAt}>
                <span>
                  <strong>{(game.type ?? "game").toLowerCase()}</strong>
                  <small>
                    {new Date(game.completedAt ?? 0).toLocaleDateString()} ·{" "}
                    {game.totalCards ?? 0} cards
                  </small>
                </span>
                <b>
                  {game.accuracy == null
                    ? "—"
                    : `${game.accuracy.toFixed(0)}%`}
                </b>
              </a>
            ))}
            {!recentGames.length && <p>No completed games yet.</p>}
          </div>
        </div>
        <div>
          <h3>Difficult words</h3>
          <div className="difficult-list">
            {difficultWords.slice(0, 5).map((word) => (
              <span key={`${word.source}-${word.id}`}>
                <strong>{word.german}</strong>
                <small>{word.english}</small>
              </span>
            ))}
            {!difficultWords.length && (
              <p>No difficult words right now.</p>
            )}
          </div>
          <button
            className="secondary"
            disabled={!difficultWords.length}
            onClick={practiseDifficult}
          >
            Practise difficult words
          </button>
        </div>
      </div>
    </section>
  );
}
