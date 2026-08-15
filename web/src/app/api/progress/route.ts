import { backend } from "@/lib/backend";

export async function GET() {
  return backend("/api/v1/progress");
}
