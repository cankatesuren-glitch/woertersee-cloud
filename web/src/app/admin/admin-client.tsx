"use client";
import { FormEvent, useEffect, useState } from "react";
type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
  sortOrder: number;
};
type Word = {
  id: string;
  german: string;
  english: string;
  presentForm: string | null;
  preteriteForm: string | null;
  perfectForm: string | null;
  version: number;
  categoryIds: string[];
};
type Feedback = {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
};
export default function AdminClient() {
  const [categories, setCategories] = useState<Category[]>([]),
    [words, setWords] = useState<Word[]>([]),
    [feedback, setFeedback] = useState<Feedback[]>([]),
    [error, setError] = useState("");
  async function load() {
    const [cr, wr, fr] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/words"),
      fetch("/api/admin/feedback"),
    ]);
    if ([cr, wr, fr].some((r) => r.status === 403))
      return setError("Your account does not have the ADMIN role.");
    if (cr.ok) setCategories(await cr.json());
    if (wr.ok) setWords(await wr.json());
    if (fr.ok) setFeedback(await fr.json());
  }
  useEffect(() => {
    load();
  }, []);
  async function addWord(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form),
      r = await fetch("/api/admin/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          german: data.get("german"),
          english: data.get("english"),
          presentForm: data.get("presentForm") || null,
          preteriteForm: data.get("preteriteForm") || null,
          perfectForm: data.get("perfectForm") || null,
          categoryIds: data.get("categoryId") ? [data.get("categoryId")] : [],
        }),
      });
    if (r.ok) {
      form.reset();
      await load();
    } else setError((await r.json()).detail ?? "Word could not be created.");
  }
  async function addCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form),
      r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          slug: data.get("slug"),
          type: "SYSTEM",
          sortOrder: categories.length,
        }),
      });
    if (r.ok) {
      form.reset();
      await load();
    } else
      setError((await r.json()).detail ?? "Category could not be created.");
  }
  async function removeWord(word: Word) {
    if (!confirm(`Archive ${word.german}?`)) return;
    const r = await fetch(`/api/admin/words/${word.id}`, { method: "DELETE" });
    if (r.ok) await load();
  }
  async function editWord(word: Word) {
    const english = prompt(`English meaning for ${word.german}`, word.english);
    if (!english) return;
    const r = await fetch(`/api/admin/words/${word.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": String(word.version),
      },
      body: JSON.stringify({ ...word, english }),
    });
    if (r.ok) await load();
    else
      setError((await r.json()).detail ?? "Word changed before your update.");
  }
  async function resolve(id: string) {
    const note = prompt("Optional resolution note") ?? "";
    const r = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", adminNote: note }),
    });
    if (r.ok) await load();
  }
  return (
    <main className="words-shell">
      <header>
        <a className="brand" href="/">
          Wörter<span>See</span>
        </a>
        <a href="/">Exit admin</a>
      </header>
      <section className="words-intro">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Vocabulary operations.</h1>
        <p>Local admin: admin / local-admin-only</p>
        {error && <p className="error">{error}</p>}
      </section>
      <section className="words-grid">
        <div>
          <h2>Add global word</h2>
          <form className="word-form" onSubmit={addWord}>
            <label>
              German
              <input name="german" required />
            </label>
            <label>
              English
              <input name="english" required />
            </label>
            <label>
              Present
              <input name="presentForm" />
            </label>
            <label>
              Preterite
              <input name="preteriteForm" />
            </label>
            <label>
              Perfect
              <input name="perfectForm" />
            </label>
            <label>
              Category
              <select name="categoryId">
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary">Add global word</button>
          </form>
        </div>
        <div>
          <h2>{words.length} global words</h2>
          <div className="word-list">
            {words.slice(0, 100).map((w) => (
              <article key={w.id}>
                <div>
                  <strong>{w.german}</strong>
                  <span>
                    {w.english}
                    {w.presentForm
                      ? ` · ${w.presentForm} · ${w.preteriteForm} · ${w.perfectForm}`
                      : ""}
                  </span>
                </div>
                <span>
                  <button onClick={() => editWord(w)}>Edit</button>
                  <button onClick={() => removeWord(w)}>Archive</button>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="words-grid">
        <div>
          <h2>Add category</h2>
          <form className="word-form" onSubmit={addCategory}>
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[a-z0-9-]+" />
            </label>
            <button className="primary">Add category</button>
          </form>
        </div>
        <div>
          <h2>{categories.length} categories</h2>
          <div className="word-list">
            {categories.map((c) => (
              <article key={c.id}>
                <div>
                  <strong>{c.name}</strong>
                  <span>
                    {c.slug} · {c.type}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="words-grid">
        <div>
          <h2>Feedback queue</h2>
        </div>
        <div className="word-list">
          {feedback.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.subject}</strong>
                <span>
                  {item.type} · {item.status} · {item.message}
                </span>
              </div>
              {item.status !== "RESOLVED" && (
                <button onClick={() => resolve(item.id)}>Resolve</button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
