import { backend } from "@/lib/backend";

export async function GET() {
  return backend("/api/v1/profile/practice-reminder");
}

export async function PUT(request: Request) {
  return backend("/api/v1/profile/practice-reminder", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
