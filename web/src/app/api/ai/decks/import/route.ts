import { backend } from "@/lib/backend";

export async function POST(request: Request) {
  return backend("/api/v1/ai/decks/import", {
    method: "POST",
    body: await request.text(),
  });
}
