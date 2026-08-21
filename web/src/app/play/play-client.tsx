"use client";

import { useEffect, useMemo, useState } from "react";

type Word = { id: string; german: string; english: string };
type Category = { id: string; name: string; wordCount: number };
type PersonalCategory = { name: string; wordCount: number };
type Card = {
  id: string;
  wordId: string;
  source: "GLOBAL" | "PERSONAL";
  front: string;
  back: string;
  forms: string[];
  result: "KNOWN" | "DIFFICULT" | null;
  nextReviewAt: string | null;
};
type Game = {
  id: string;
  status: string;
  direction: string;
  cards: Card[];
  answered: number;
  known: number;
  difficult: number;
  accuracy: number | null;
};
type DeckMode = "quick" | "category" | "words";

export default function PlayClient({ userName }: { userName: string }) {
  const [words, setWords] = useState<Word[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [personalCategories, setPersonalCategories] = useState<PersonalCategory[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<DeckMode>("quick");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [selectedPersonalCategories, setSelectedPersonalCategories] = useState<string[]>([]);
  const [wordIds, setWordIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [direction, setDirection] = useState("DE_EN");
  const [ordering, setOrdering] = useState("RANDOM");
  const [unseenOnly, setUnseenOnly] = useState(false);

  useEffect(() => {
    const session = new URLSearchParams(location.search).get("session");
    if (session) {
      fetch(`/api/games/${session}`)
        .then(readJson)
        .then(setGame)
        .catch(() => setError("The saved game is unavailable."));
      return;
    }
    Promise.all([
      fetch("/api/vocabulary").then(readJson),
      fetch("/api/vocabulary/categories").then(readJson),
      fetch("/api/personal-words/categories").then(readJson),
    ])
      .then(([loadedWords, loadedCategories, loadedPersonalCategories]) => {
        setWords(loadedWords);
        setCategories(loadedCategories);
        setPersonalCategories(loadedPersonalCategories);
      })
      .catch(() => setError("The vocabulary catalogue is unavailable."));
  }, []);

  const visibleWords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query
      ? words.filter((word) =>
          `${word.german} ${word.english}`.toLocaleLowerCase().includes(query),
        )
      : words;
  }, [search, words]);

  function toggle(
    value: string,
    selected: string[],
    update: (values: string[]) => void,
  ) {
    update(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  }

  async function start() {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordIds: mode === "words" ? wordIds : [],
        categoryIds: mode === "category" ? categoryIds : [],
        personalCategories: mode === "category" ? selectedPersonalCategories : [],
        cardCount: mode === "words" ? wordIds.length : cardCount,
        direction,
        ordering,
        unseenOnly: mode === "quick" && unseenOnly,
      }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.detail ?? "Could not start a game.");
    setGame(body);
    setIndex(0);
    setError("");
    history.replaceState(null, "", `/play?session=${body.id}`);
  }

  async function answer(result: "KNOWN" | "DIFFICULT") {
    const current = game?.cards[index];
    if (!game || !current) return;
    const response = await fetch(
      `/api/games/${game.id}/cards/${current.id}/answer`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ result }),
      },
    );
    const body = await response.json();
    if (!response.ok)
      return setError(body.detail ?? "Could not save the answer.");
    const answeredCard = body.cards.find((card: Card) => card.id === current.id);
    setNotice(reviewMessage(result, answeredCard?.nextReviewAt));
    setGame(body);
    setRevealed(false);
    if (index < body.cards.length - 1) setIndex(index + 1);
    else await action("finish", body.id);
  }

  async function action(name: "finish" | "review" | "replay", id = game?.id) {
    if (!id) return;
    const response = await fetch(`/api/games/${id}/${name}`, {
      method: "POST",
    });
    const body = await response.json();
    if (!response.ok) return setError(body.detail ?? "Action failed.");
    setGame(body);
    setIndex(0);
    setRevealed(false);
    history.replaceState(null, "", `/play?session=${body.id}`);
  }

  async function report() {
    const current = game?.cards[index];
    if (!current || current.source !== "GLOBAL") return;
    const message = prompt("What should be corrected about this word?");
    if (!message) return;
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "WORD_REPORT",
        wordId: current.wordId,
        subject: `Word report: ${current.front}`,
        message,
      }),
    });
    setNotice(
      response.ok
        ? "Report sent to the admin queue."
        : "Report could not be sent.",
    );
  }

  if (!game)
    return (
      <DeckBuilder
        userName={userName}
        mode={mode}
        setMode={setMode}
        categories={categories}
        personalCategories={personalCategories}
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        selectedPersonalCategories={selectedPersonalCategories}
        setSelectedPersonalCategories={setSelectedPersonalCategories}
        words={visibleWords}
        wordIds={wordIds}
        setWordIds={setWordIds}
        search={search}
        setSearch={setSearch}
        cardCount={cardCount}
        setCardCount={setCardCount}
        direction={direction}
        setDirection={setDirection}
        ordering={ordering}
        setOrdering={setOrdering}
        unseenOnly={unseenOnly}
        setUnseenOnly={setUnseenOnly}
        start={start}
        toggle={toggle}
        error={error}
      />
    );

  const current = game.cards[index];
  const englishVisible = game.direction === "DE_EN" ? revealed : !revealed;
  if (game.status !== "ACTIVE")
    return (
      <main className="play-shell">
        <header>
          <a className="brand" href="/">
            Wörter<span>See</span>
          </a>
          <span>Game complete</span>
        </header>
        <section className="results">
          <p className="eyebrow">SESSION COMPLETE</p>
          <h1>{game.accuracy?.toFixed(0) ?? "—"}%</h1>
          <p>
            {game.answered} answered · {game.known} known · {game.difficult}{" "}
            difficult
          </p>
          <div className="actions">
            <button
              className="primary"
              disabled={!game.difficult}
              onClick={() => action("review")}
            >
              Review my mistakes
            </button>
            <button className="secondary" onClick={() => action("replay")}>
              Replay original deck
            </button>
            <a href="/play">Build another deck</a>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );

  return (
    <main className="play-shell">
      <header>
        <a className="brand" href="/">
          Wörter<span>See</span>
        </a>
        <span>
          {index + 1} / {game.cards.length}
        </span>
      </header>
      <div
        className="progress"
        role="progressbar"
        aria-label="Deck progress"
        aria-valuemin={0}
        aria-valuemax={game.cards.length}
        aria-valuenow={index}
      >
        <i
          style={{
            width: `${((index + (current?.result ? 1 : 0)) / game.cards.length) * 100}%`,
          }}
        />
      </div>
      <section className="card-stage">
        <button
          type="button"
          className="word-card"
          onClick={() => setRevealed((visible) => !visible)}
          aria-label={
            revealed
              ? `Translation: ${current?.back}`
              : `Reveal translation for ${current?.front}`
          }
        >
          <p>
            {revealed
              ? "TRANSLATION"
              : game.direction === "DE_EN"
                ? "GERMAN"
                : "ENGLISH"}
          </p>
          <h1>{revealed ? current?.back : current?.front}</h1>
          {englishVisible && current?.forms.length === 3 ? (
            <span>
              Präteritum: {current.forms[1]} · Perfekt: {current.forms[2]}
            </span>
          ) : null}
          <small>{revealed ? "Tap to see the first side" : "Tap to reveal"}</small>
        </button>
        {current?.source === "GLOBAL" && (
          <button className="finish" onClick={report}>
            Report this word
          </button>
        )}
        {notice && <p>{notice}</p>}
        {revealed && (
          <div className="answer-actions">
            <button className="answer-again" onClick={() => answer("DIFFICULT")}>
              <span>Not yet</span>
              <small>Show me again sooner</small>
            </button>
            <button className="answer-known" onClick={() => answer("KNOWN")}>
              <span>Got it</span>
              <small>I remembered this</small>
            </button>
          </div>
        )}
        <button className="finish session-exit" onClick={() => action("finish")}>
          Finish this session
        </button>
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

async function readJson(response: Response) {
  if (!response.ok) throw new Error();
  return response.json();
}

type BuilderProps = {
  userName: string;
  mode: DeckMode;
  setMode: (value: DeckMode) => void;
  categories: Category[];
  personalCategories: PersonalCategory[];
  categoryIds: string[];
  setCategoryIds: (ids: string[]) => void;
  selectedPersonalCategories: string[];
  setSelectedPersonalCategories: (names: string[]) => void;
  words: Word[];
  wordIds: string[];
  setWordIds: (ids: string[]) => void;
  search: string;
  setSearch: (value: string) => void;
  cardCount: number;
  setCardCount: (value: number) => void;
  direction: string;
  setDirection: (value: string) => void;
  ordering: string;
  setOrdering: (value: string) => void;
  unseenOnly: boolean;
  setUnseenOnly: (value: boolean) => void;
  start: () => void;
  toggle: (
    value: string,
    selected: string[],
    update: (values: string[]) => void,
  ) => void;
  error: string;
};

function DeckBuilder(props: BuilderProps) {
  const canStart =
    props.mode === "quick" ||
    (props.mode === "category"
      ? props.categoryIds.length > 0 || props.selectedPersonalCategories.length > 0
      : props.wordIds.length > 0);
  return (
    <main className="play-shell">
      <header>
        <a className="brand" href="/">
          Wörter<span>See</span>
        </a>
        <span>Hello, {props.userName}</span>
      </header>
      <section className="builder">
        <div className="builder-intro">
          <p className="eyebrow">BUILD A DECK</p>
          <h1>What do you want to practise?</h1>
          <div className="mode-tabs" role="tablist" aria-label="Deck type">
            <button
              className={props.mode === "quick" ? "active" : ""}
              role="tab"
              aria-selected={props.mode === "quick"}
              onClick={() => props.setMode("quick")}
            >
              Quick play
            </button>
            <button
              className={props.mode === "category" ? "active" : ""}
              role="tab"
              aria-selected={props.mode === "category"}
              onClick={() => props.setMode("category")}
            >
              Categories
            </button>
            <button
              className={props.mode === "words" ? "active" : ""}
              role="tab"
              aria-selected={props.mode === "words"}
              onClick={() => props.setMode("words")}
            >
              Pick words
            </button>
          </div>
        </div>
        <div className="builder-content">
          {props.mode === "quick" && (
            <div className="smart-deck">
              <div>
                <span aria-hidden="true">↻</span>
                <p>
                  <strong>Smart review mix</strong>
                  <small>Words due today come first, followed by new material.</small>
                </p>
              </div>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={props.unseenOnly}
                  onChange={(event) => props.setUnseenOnly(event.target.checked)}
                />
                <span>
                  <strong>New words only</strong>
                  <small>Skip scheduled reviews for this deck.</small>
                </span>
              </label>
            </div>
          )}
          {props.mode === "category" && (
            <div className="choice-list">
              {props.personalCategories.length > 0 && <p className="choice-group">MY WORDS</p>}
              {props.personalCategories.map((category) => (
                <label className="choice" key={`personal-${category.name}`}>
                  <input
                    type="checkbox"
                    checked={props.selectedPersonalCategories.includes(category.name)}
                    onChange={() => props.toggle(category.name, props.selectedPersonalCategories, props.setSelectedPersonalCategories)}
                  />
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.wordCount} personal words</small>
                  </span>
                </label>
              ))}
              {props.categories.length > 0 && <p className="choice-group">COURSE LIBRARY</p>}
              {props.categories.map((category) => (
                <label className="choice" key={category.id}>
                  <input
                    type="checkbox"
                    checked={props.categoryIds.includes(category.id)}
                    onChange={() =>
                      props.toggle(
                        category.id,
                        props.categoryIds,
                        props.setCategoryIds,
                      )
                    }
                  />
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category.wordCount} words</small>
                  </span>
                </label>
              ))}
            </div>
          )}
          {props.mode === "words" && (
            <>
              <input
                className="deck-search"
                value={props.search}
                onChange={(event) => props.setSearch(event.target.value)}
                placeholder="Search German or English"
                aria-label="Search words"
              />
              <p>{props.wordIds.length} selected</p>
              <div className="choice-list word-picker">
                {props.words.map((word) => (
                  <label className="choice" key={word.id}>
                    <input
                      type="checkbox"
                      checked={props.wordIds.includes(word.id)}
                      disabled={
                        !props.wordIds.includes(word.id) &&
                        props.wordIds.length >= 100
                      }
                      onChange={() =>
                        props.toggle(word.id, props.wordIds, props.setWordIds)
                      }
                    />
                    <span>
                      <strong>{word.german}</strong>
                      <small>{word.english}</small>
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="deck-options">
            <label>
              Cards
              <input
                type="number"
                min="1"
                max="100"
                value={
                  props.mode === "words"
                    ? props.wordIds.length
                    : props.cardCount
                }
                disabled={props.mode === "words"}
                onChange={(event) =>
                  props.setCardCount(Number(event.target.value))
                }
              />
            </label>
            <label>
              Direction
              <select
                value={props.direction}
                onChange={(event) => props.setDirection(event.target.value)}
              >
                <option value="DE_EN">German → English</option>
                <option value="EN_DE">English → German</option>
              </select>
            </label>
            <label>
              Order
              <select
                value={props.ordering}
                onChange={(event) => props.setOrdering(event.target.value)}
              >
                <option value="RANDOM">Random</option>
                <option value="AZ">A–Z</option>
              </select>
            </label>
          </div>
          <button
            className="primary build-button"
            disabled={!canStart}
            onClick={props.start}
          >
            Start deck →
          </button>
          {props.error && (
            <p role="alert" className="error">
              {props.error}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function reviewMessage(result: "KNOWN" | "DIFFICULT", nextReviewAt?: string | null) {
  if (!nextReviewAt) return "Your review schedule was updated.";
  if (result === "DIFFICULT") return "Noted — this word will return in about 10 minutes.";
  const days = Math.max(
    1,
    Math.round((new Date(nextReviewAt).getTime() - Date.now()) / 86_400_000),
  );
  return `Nice — this word is scheduled again in ${days} day${days === 1 ? "" : "s"}.`;
}
