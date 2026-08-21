"use client";

import { FormEvent, useState } from "react";

type Card = {
  german: string;
  english: string;
  description: string | null;
  preterite: string | null;
  perfect: string | null;
};
type Preview = { title: string; category: string; cards: Card[] };

const levels = ["A1", "A2", "B1", "B2", "C1"];

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    throw new Error(`The server returned an empty response (${response.status}).`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`The server returned an unreadable response (${response.status}).`);
  }
}

export default function AiDeckStudio() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGenerating(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/ai/decks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: data.get("topic"),
          level: data.get("level"),
          cardCount: Number(data.get("cardCount")),
          category: data.get("category") || null,
        }),
        signal: AbortSignal.timeout(120_000),
      });
      const body = await readResponse(response);
      if (response.ok) setPreview(body);
      else setMessage(body.detail ?? "The deck could not be generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The deck could not be generated.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateFromPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPdfGenerating(true);
    setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      const file = data.get("file");
      if (!(file instanceof File) || !file.size) throw new Error("Choose a PDF file.");
      const response = await fetch("/api/ai/decks/generate-from-pdf", {
        method: "POST",
        body: data,
        signal: AbortSignal.timeout(120_000),
      });
      const body = await readResponse(response);
      if (response.ok) setPreview(body);
      else setMessage(body.detail ?? "The PDF deck could not be generated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The PDF deck could not be generated.");
    } finally {
      setPdfGenerating(false);
    }
  }

  function update(index: number, field: keyof Card, value: string) {
    setPreview((current) =>
      current
        ? {
            ...current,
            cards: current.cards.map((card, cardIndex) =>
              cardIndex === index ? { ...card, [field]: value || null } : card,
            ),
          }
        : current,
    );
  }

  function remove(index: number) {
    setPreview((current) =>
      current
        ? { ...current, cards: current.cards.filter((_, cardIndex) => cardIndex !== index) }
        : current,
    );
  }

  async function save() {
    if (!preview?.cards.length) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/ai/decks/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: preview.category, cards: preview.cards }),
        signal: AbortSignal.timeout(30_000),
      });
      const body = await readResponse(response);
      if (response.ok) {
        setMessage(`${body.added} cards saved · ${body.skipped} duplicates skipped.`);
        setPreview(null);
      } else setMessage(body.detail ?? "The reviewed cards could not be saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The reviewed cards could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="ai-shell">
      <header>
        <a className="brand" href="/">Wörter<span>See</span></a>
        <nav><a href="/words">My words</a><a href="/play">Practice</a></nav>
      </header>
      <section className="ai-hero">
        <p className="eyebrow">AI DECK STUDIO</p>
        <h1>Turn a topic into<br /><em>words worth learning.</em></h1>
        <p>Generate a focused draft locally, review every card and save only what feels useful.</p>
      </section>
      <section className="ai-workspace">
        <div className="ai-controls">
          <form className="ai-form" onSubmit={generate}>
            <p className="eyebrow">BUILD FROM A TOPIC</p>
            <label>Topic or situation<textarea name="topic" required maxLength={300} rows={4} placeholder="For example: renting an apartment in Berlin" /></label>
            <div className="ai-form-row">
              <label>Level<select name="level" defaultValue="B1">{levels.map(level => <option key={level}>{level}</option>)}</select></label>
              <label>Cards<input name="cardCount" type="number" min={1} max={50} defaultValue={10} /></label>
            </div>
            <label>Category <span>(optional)</span><input name="category" maxLength={140} placeholder="AI · Apartment search" /></label>
            <button className="primary" disabled={generating}>{generating ? "Building your deck…" : "Create draft"}</button>
            <p className="ai-privacy">Generated by your local Ollama model. Your topic is not sent to a paid cloud AI service.</p>
          </form>
          <form className="ai-form ai-pdf-form" onSubmit={generateFromPdf}>
            <p className="eyebrow">BUILD FROM A PDF</p>
            <label>PDF document<input name="file" type="file" accept="application/pdf,.pdf" required /></label>
            <div className="ai-form-row">
              <label>Level<select name="level" defaultValue="B1">{levels.map(level => <option key={level}>{level}</option>)}</select></label>
              <label>Cards<input name="cardCount" type="number" min={1} max={50} defaultValue={10} /></label>
            </div>
            <label>Category <span>(optional)</span><input name="category" maxLength={140} placeholder="Defaults to the PDF name" /></label>
            <button className="primary" disabled={pdfGenerating}>{pdfGenerating ? "Reading your PDF…" : "Create draft from PDF"}</button>
            <p className="ai-privacy">Text is extracted locally and sent only to your local Ollama model. Scanned image-only PDFs are not supported yet.</p>
          </form>
        </div>
        <div className="ai-preview" aria-live="polite">
          {!preview && <div className="ai-empty"><span>01</span><h2>Your draft will appear here.</h2><p>You will be able to edit or remove every card before saving.</p></div>}
          {preview && <>
            <div className="ai-preview-head"><div><p className="eyebrow">REVIEW DRAFT</p><h2>{preview.title}</h2><p>{preview.cards.length} cards · {preview.category}</p></div><button className="primary" onClick={save} disabled={saving || !preview.cards.length}>{saving ? "Saving…" : "Save to My words"}</button></div>
            <div className="ai-cards">{preview.cards.map((card, index) => <article key={`${card.german}-${index}`}>
              <div className="ai-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="ai-card-fields">
                <label>German<input value={card.german} onChange={event => update(index, "german", event.target.value)} /></label>
                <label>English<input value={card.english} onChange={event => update(index, "english", event.target.value)} /></label>
                <label className="wide">Usage note <span>(optional)</span><textarea rows={2} value={card.description ?? ""} onChange={event => update(index, "description", event.target.value)} /></label>
                {(card.preterite || card.perfect) && <div className="ai-forms wide"><label>Präteritum<input value={card.preterite ?? ""} onChange={event => update(index, "preterite", event.target.value)} /></label><label>Perfekt<input value={card.perfect ?? ""} onChange={event => update(index, "perfect", event.target.value)} /></label></div>}
              </div>
              <button className="ai-remove" onClick={() => remove(index)} aria-label={`Remove ${card.german}`}>Remove</button>
            </article>)}</div>
          </>}
          {message && <p className="ai-message" role="status">{message}</p>}
        </div>
      </section>
    </main>
  );
}
