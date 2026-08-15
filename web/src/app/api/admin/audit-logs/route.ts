import { backend } from "@/lib/backend";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.toString();
  return backend(`/api/v1/admin/audit-logs${query ? `?${query}` : ""}`);
}
