import { backend } from "@/lib/backend";

export async function PUT(request: Request) {
  return backend("/api/v1/profile/learning-goal", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
