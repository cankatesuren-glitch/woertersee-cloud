# Contributing

## Change workflow

Every independent change starts from an up-to-date `main` branch and is delivered through its own branch and pull request.

```text
agent/<short-purpose>
```

A branch should contain one coherent change. Commits use short, specific descriptions of the resulting behavior. Direct commits to `main` are not part of the normal workflow.

Before requesting review:

1. Rebase or merge the latest `main` as appropriate.
2. Run the relevant backend and frontend checks.
3. Review the complete diff for unrelated files, generated noise and accidental credentials.
4. Explain the product impact and verification in the pull request.
5. Keep the pull request in draft while required behavior or checks are incomplete.

## Engineering standards

- Prefer direct domain language over generic abstractions.
- Add an abstraction only when there are multiple real callers or a clear boundary.
- Keep controllers thin and transaction rules in application services.
- Enforce ownership and invariants in backend code and database constraints.
- Write comments for decisions and non-obvious constraints, not as narration of the code.
- Use concrete product copy; avoid placeholder statistics, inflated claims and vague marketing language.
- Keep formatting and naming consistent with the surrounding module.
- Record architectural trade-offs in ADRs when they affect future development.
- Do not report performance, reliability or coverage numbers that were not measured.

