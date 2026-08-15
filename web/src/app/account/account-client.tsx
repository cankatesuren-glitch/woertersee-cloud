"use client";

import { useEffect, useState } from "react";

type Profile = {
  displayName: string | null;
};

export default function AccountClient() {
  const [status, setStatus] = useState("Preparing your learning profile…");

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((profile: Profile) =>
        setStatus(
          profile.displayName
            ? `${profile.displayName}'s learning profile is connected`
            : "Learning profile connected",
        ),
      )
      .catch(() => setStatus("Learning profile is temporarily unavailable"));
  }, []);

  return <small aria-live="polite">{status}</small>;
}
