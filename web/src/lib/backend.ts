import { auth } from "@/auth";
import { NextResponse } from "next/server";
const apiBase = process.env.API_BASE_URL ?? "http://localhost:8080";
export async function backend(path: string, init: RequestInit = {}) {
  const session = await auth();
  const token = (session as typeof session & { accessToken?: string } | null)?.accessToken;
  if (!token) return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  const response = await fetch(`${apiBase}${path}`, {...init, cache:"no-store", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...init.headers}});
  return new NextResponse(await response.text(), {status:response.status,headers:{"Content-Type":response.headers.get("Content-Type")??"application/json"}});
}
