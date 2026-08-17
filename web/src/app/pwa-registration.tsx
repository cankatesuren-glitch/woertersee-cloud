"use client";

import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaRegistration() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(
    null,
  );
  const [iosInstallAvailable, setIosInstallAvailable] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    }
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIosInstallAvailable(appleMobile && !standalone);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  if (!installPrompt && !iosInstallAvailable) return null;
  if (iosInstallAvailable)
    return (
      <aside className="ios-install">
        <button className="install-app" onClick={() => setShowIosHelp((visible) => !visible)}>
          Add to iPhone
        </button>
        {showIosHelp && (
          <div className="ios-install-help" role="dialog" aria-label="Install WörterSee on iPhone">
            <strong>Keep WörterSee on your Home Screen</strong>
            <ol>
              <li>Open this site in Safari.</li>
              <li>Tap the Share button.</li>
              <li>Choose Add to Home Screen, then Add.</li>
            </ol>
            <button onClick={() => setShowIosHelp(false)}>Got it</button>
          </div>
        )}
      </aside>
    );
  if (!installPrompt) return null;
  return (
    <button
      className="install-app"
      onClick={async () => {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      }}
    >
      Install WörterSee
    </button>
  );
}
