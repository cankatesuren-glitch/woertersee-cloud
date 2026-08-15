# Offline policy

WörterSee is installable as a progressive web application, but learning remains online-first. The service worker caches only the offline explanation page, the manifest, the application icon and versioned framework assets.

Authenticated pages, API responses, account details, vocabulary, game cards and progress records are never written to the service-worker cache. When navigation fails without a network connection, the app shows a clear offline page and asks the learner to reconnect. Offline gameplay and queued answer synchronisation require a separately designed conflict and retry model and are intentionally outside this foundation.
