import { auth } from "@/auth";
import { NextResponse } from "next/server";
const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
export async function backend(path: string, init: RequestInit = {}) {
  const session = await auth();
  const token = (session as typeof session & { accessToken?: string } | null)?.accessToken;
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && typeof init.body === "string") {
      headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      cache: "no-store",
      headers,
      signal: init.signal ?? AbortSignal.timeout(180_000),
    });
    const body = await response.text();
    return new NextResponse(body || JSON.stringify({ detail: `API returned an empty response (${response.status}).` }), {
      status: response.status,
      headers: {"Content-Type": response.headers.get("Content-Type") ?? "application/json"},
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Backend request failed";
    return NextResponse.json({ detail }, { status: 503 });
  }
}
