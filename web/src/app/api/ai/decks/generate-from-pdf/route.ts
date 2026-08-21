import { backend } from "@/lib/backend";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data")) {
    return Response.json({ detail: "A PDF file is required." }, { status: 400 });
  }
  return backend("/api/v1/ai/decks/generate-from-pdf", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: await request.arrayBuffer(),
  });
}
