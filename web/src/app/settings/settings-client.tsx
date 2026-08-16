"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { components, operations } from "@/lib/api/schema";

const options = [
  {
    type: "UNSEEN_HISTORY",
    title: "Reset unseen history",
    text: "Make played words eligible for unseen practice again.",
    confirmation: "Your saved accuracy and game history will stay intact.",
  },
  {
    type: "LEARNING_PROGRESS",
    title: "Reset learning progress",
    text: "Remove known, difficult and accuracy history.",
    confirmation: "Your saved game sessions will stay in your history.",
  },
  {
    type: "ALL_PROGRESS",
    title: "Reset all progress",
    text: "Remove learning history and every saved game session.",
    confirmation: "This removes all of your learning progress and game history.",
  },
] as const;

type ResetOption = (typeof options)[number];
type Notice = { kind: "success" | "error"; text: string };
type ResetProgressRequest = operations["reset"]["requestBody"]["content"]["application/json"];
type ResetProgressResult = components["schemas"]["ResetProgressResult"];
type ApiProblem = { detail?: string };
type ReminderPreference = Required<
  components["schemas"]["PracticeReminderPreference"]
>;

async function responseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;

  return response.json().catch(() => null) as Promise<
    (ResetProgressResult & ApiProblem) | null
  >;
}

export default function SettingsClient() {
  const [selected, setSelected] = useState<ResetOption | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [reminder, setReminder] = useState<ReminderPreference>({
    enabled: false,
    localTime: "18:00",
    timezone: "Europe/Berlin",
  });
  const [reminderPending, setReminderPending] = useState(true);
  const [reminderNotice, setReminderNotice] = useState<Notice | null>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) setReminder((current) => ({ ...current, timezone }));

    fetch("/api/profile/practice-reminder")
      .then(async (response) => {
        if (!response.ok) throw new Error("Reminder settings could not be loaded.");
        return response.json() as Promise<ReminderPreference>;
      })
      .then((preference) =>
        setReminder({
          ...preference,
          localTime: preference.localTime.slice(0, 5),
        }),
      )
      .catch((error) =>
        setReminderNotice({
          kind: "error",
          text: error instanceof Error ? error.message : "Reminder settings could not be loaded.",
        }),
      )
      .finally(() => setReminderPending(false));
  }, []);

  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        setSelected(null);
        requestAnimationFrame(() => returnFocusTo.current?.focus());
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, pending]);

  function openConfirmation(option: ResetOption) {
    returnFocusTo.current = document.activeElement as HTMLElement;
    setNotice(null);
    setSelected(option);
  }

  function closeConfirmation() {
    if (pending) return;
    setSelected(null);
    requestAnimationFrame(() => returnFocusTo.current?.focus());
  }

  async function confirmReset() {
    if (!selected || pending) return;

    setPending(true);
    setNotice(null);

    try {
      const request = {
        type: selected.type,
        confirmed: true,
      } satisfies ResetProgressRequest;
      const response = await fetch("/api/progress/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await responseBody(response);

      if (!response.ok) {
        throw new Error(body?.detail ?? "Reset failed. Please try again.");
      }

      const changed = body?.affectedRecords ?? 0;
      setNotice({
        kind: "success",
        text: `${selected.title} completed. ${changed} records changed.`,
      });
      setSelected(null);
      requestAnimationFrame(() => returnFocusTo.current?.focus());
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Reset failed. Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function saveReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReminderPending(true);
    setReminderNotice(null);
    try {
      const response = await fetch("/api/profile/practice-reminder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminder),
      });
      const body = (await response.json().catch(() => null)) as
        | (ReminderPreference & ApiProblem)
        | null;
      if (!response.ok) throw new Error(body?.detail ?? "Reminder settings could not be saved.");
      if (body) setReminder({ ...body, localTime: body.localTime.slice(0, 5) });
      setReminderNotice({ kind: "success", text: "Practice reminder saved." });
    } catch (error) {
      setReminderNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Reminder settings could not be saved.",
      });
    } finally {
      setReminderPending(false);
    }
  }

  return (
    <main className="words-shell settings-shell">
      <header>
        <a className="brand" href="/">
          Wörter<span>See</span>
        </a>
        <a href="/play">Back to learning</a>
      </header>
      <section className="words-intro">
        <p className="eyebrow">SETTINGS</p>
        <h1>
          Your learning data,
          <br />
          under your control.
        </h1>
        <p className="settings-lede">
          Choose exactly what you want to reset. Your account and personal words
          are never removed here.
        </p>
      </section>
      <section className="reminder-settings" aria-labelledby="reminder-title">
        <div>
          <p className="eyebrow">PRACTICE RHYTHM</p>
          <h2 id="reminder-title">Practice reminder</h2>
          <p>Choose when you want a gentle nudge to return to your words.</p>
        </div>
        <form onSubmit={saveReminder}>
          <label className="reminder-toggle">
            <input
              checked={reminder.enabled}
              disabled={reminderPending}
              onChange={(event) =>
                setReminder((current) => ({ ...current, enabled: event.target.checked }))
              }
              type="checkbox"
            />
            Remind me to practice
          </label>
          <label>
            Reminder time
            <input
              disabled={!reminder.enabled || reminderPending}
              onChange={(event) =>
                setReminder((current) => ({ ...current, localTime: event.target.value }))
              }
              required
              type="time"
              value={reminder.localTime}
            />
          </label>
          <label>
            Time zone
            <input
              disabled={!reminder.enabled || reminderPending}
              onChange={(event) =>
                setReminder((current) => ({ ...current, timezone: event.target.value }))
              }
              required
              type="text"
              value={reminder.timezone}
            />
          </label>
          <button disabled={reminderPending} type="submit">
            {reminderPending ? "Saving…" : "Save reminder"}
          </button>
          {reminderNotice && (
            <p className={`settings-notice ${reminderNotice.kind}`} role="status">
              {reminderNotice.text}
            </p>
          )}
        </form>
      </section>
      <section className="settings-list" aria-label="Learning data reset options">
        {options.map((option) => (
          <article key={option.type}>
            <div>
              <strong>{option.title}</strong>
              <span>{option.text}</span>
            </div>
            <button type="button" onClick={() => openConfirmation(option)}>
              Review reset
            </button>
          </article>
        ))}
        {notice && (
          <p className={`settings-notice ${notice.kind}`} role="status">
            {notice.text}
          </p>
        )}
      </section>

      {selected && (
        <div className="settings-dialog-backdrop" onMouseDown={closeConfirmation}>
          <section
            aria-describedby="reset-description"
            aria-labelledby="reset-title"
            aria-modal="true"
            className="settings-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <p className="eyebrow">CONFIRM RESET</p>
            <h2 id="reset-title">{selected.title}?</h2>
            <p id="reset-description">
              {selected.confirmation} This action cannot be undone.
            </p>
            <div className="settings-dialog-actions">
              <button
                autoFocus
                className="secondary"
                disabled={pending}
                onClick={closeConfirmation}
                type="button"
              >
                Keep my data
              </button>
              <button
                className="settings-danger"
                disabled={pending}
                onClick={confirmReset}
                type="button"
              >
                {pending ? "Resetting…" : "Confirm reset"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
