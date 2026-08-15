import { backend } from "@/lib/backend";
export async function GET() {
  return backend("/api/v1/admin/categories");
}
export async function POST(request: Request) {
  return backend("/api/v1/admin/categories", {
    method: "POST",
    body: await request.text(),
  });
}
