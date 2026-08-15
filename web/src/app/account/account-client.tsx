"use client";

import { useEffect, useState } from "react";

export default function AccountClient() {
  const [status, setStatus] = useState("Preparing your learning profile…");

  useEffect(() => {
    fetch("/api/profile")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(() => setStatus("Learning profile connected"))
      .catch(() => setStatus("Learning profile is temporarily unavailable"));
  }, []);

  return <small aria-live="polite">{status}</small>;
}
