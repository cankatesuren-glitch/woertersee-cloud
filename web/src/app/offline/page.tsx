export default function OfflinePage() {
  return (
    <main className="offline-page">
      <a className="brand" href="/">
        Wörter<span>See</span>
      </a>
      <section>
        <p className="eyebrow">OFFLINE</p>
        <h1>Your words are waiting.</h1>
        <p>
          Reconnect to load your decks and synchronised learning progress. We do
          not store account or learning data in the offline cache.
        </p>
        <a className="primary" href="/">
          Try again
        </a>
      </section>
    </main>
  );
}
