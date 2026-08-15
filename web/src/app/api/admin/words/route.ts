import { backend } from "@/lib/backend";
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("query") ?? "";
  return backend(`/api/v1/admin/words?query=${encodeURIComponent(q)}`);
}
export async function POST(request: Request) {
  return backend("/api/v1/admin/words", {
    method: "POST",
    body: await request.text(),
  });
}
