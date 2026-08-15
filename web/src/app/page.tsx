const chapters = ["Kapitel 1", "Kapitel 2", "Kapitel 3", "Irregular verbs"];

export default function Home() {
  return <main>
    <nav><a className="brand" href="#">Wörter<span>See</span></a><div className="navlinks"><a href="/words">My words</a><a href="/feedback">Feedback</a><a href="/settings">Settings</a><a href="/play">Play</a></div></nav>
    <section className="hero">
      <p className="eyebrow">YOUR DAILY GERMAN PRACTICE</p>
      <h1>Words become familiar<br/><em>one card at a time.</em></h1>
      <p className="lede">Build a focused deck, practise what feels difficult and pick up exactly where you left off.</p>
      <div className="actions"><a className="primary" href="/play">Continue unseen <b>→</b></a><a className="secondary" href="/play">Review difficult</a></div>
      <div className="stats"><div><strong>128</strong><span>words explored</span></div><div><strong>74%</strong><span>accuracy</span></div><div><strong>6 days</strong><span>current streak</span></div></div>
    </section>
    <section className="deck" id="decks">
      <div><p className="eyebrow">BUILD A DECK</p><h2>Choose your next chapter.</h2></div>
      <div className="chapters">{chapters.map((chapter, index) => <button key={chapter}><span>0{index + 1}</span>{chapter}<b>→</b></button>)}</div>
    </section>
  </main>;
}
