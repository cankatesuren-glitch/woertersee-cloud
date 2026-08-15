"use client";

import { FormEvent, useEffect, useState } from "react";

type AuditLog = {
  id: string;
  actorProfileId: string | null;
  actorName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string;
  correlationId: string | null;
  createdAt: string;
};

type AuditPage = {
  items: AuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const emptyPage: AuditPage = {
  items: [],
  page: 0,
  size: 25,
  totalElements: 0,
  totalPages: 0,
};

export default function AuditLogPanel() {
  const [result, setResult] = useState(emptyPage);
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    actorProfileId: "",
  });
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");

  async function load(page: number, activeFilters = filters) {
    const query = new URLSearchParams({ page: String(page), size: "25" });
    Object.entries(activeFilters).forEach(
      ([key, value]) => value && query.set(key, value),
    );
    const response = await fetch(`/api/admin/audit-logs?${query}`);
    if (!response.ok) {
      setError(
        response.status === 403
          ? "Your account does not have the ADMIN role."
          : "Audit records could not be loaded.",
      );
      return;
    }
    setResult(await response.json());
    setError("");
  }

  useEffect(() => {
    load(0);
    // The initial request intentionally uses the empty filter set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draft);
    load(0, draft);
  }

  return (
    <section>
      <div className="audit-heading">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h2>Audit log</h2>
          <p>{result.totalElements} matching records</p>
        </div>
        <form className="audit-filters" onSubmit={applyFilters}>
          <input
            aria-label="Action"
            placeholder="Action"
            value={draft.action}
            onChange={(event) =>
              setDraft({ ...draft, action: event.target.value })
            }
          />
          <input
            aria-label="Target type"
            placeholder="Target type"
            value={draft.targetType}
            onChange={(event) =>
              setDraft({ ...draft, targetType: event.target.value })
            }
          />
          <input
            aria-label="Actor profile ID"
            placeholder="Actor profile ID"
            value={draft.actorProfileId}
            onChange={(event) =>
              setDraft({ ...draft, actorProfileId: event.target.value })
            }
          />
          <button className="primary">Filter</button>
        </form>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="audit-list">
        {result.items.map((entry) => (
          <article key={entry.id}>
            <div>
              <strong>{entry.action}</strong>
              <span>
                {entry.targetType}
                {entry.targetId ? ` · ${entry.targetId}` : ""}
              </span>
              <small>
                {entry.actorName ?? entry.actorProfileId ?? "System"} ·{" "}
                {new Date(entry.createdAt).toLocaleString()}
              </small>
            </div>
            <details>
              <summary>Details</summary>
              <pre>{JSON.stringify(JSON.parse(entry.metadata), null, 2)}</pre>
              {entry.correlationId && (
                <small>Correlation: {entry.correlationId}</small>
              )}
            </details>
          </article>
        ))}
        {!result.items.length && !error && (
          <p>No audit records match these filters.</p>
        )}
      </div>
      <nav className="audit-pagination" aria-label="Audit log pages">
        <button
          disabled={result.page === 0}
          onClick={() => load(result.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {result.totalPages ? result.page + 1 : 0} of {result.totalPages}
        </span>
        <button
          disabled={result.page + 1 >= result.totalPages}
          onClick={() => load(result.page + 1)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
