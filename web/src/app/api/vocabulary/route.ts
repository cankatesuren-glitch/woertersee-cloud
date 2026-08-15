import { backend } from "@/lib/backend";
export async function GET(request: Request) { const q=new URL(request.url).searchParams.get("query")??""; return backend(`/api/v1/vocabulary/words?query=${encodeURIComponent(q)}`); }
