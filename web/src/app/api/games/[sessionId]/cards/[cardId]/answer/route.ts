import { backend } from "@/lib/backend";
export async function PUT(request:Request,ctx:{params:Promise<{sessionId:string;cardId:string}>}) { const {sessionId,cardId}=await ctx.params; return backend(`/api/v1/games/${sessionId}/cards/${cardId}/answer`,{method:"PUT",body:await request.text(),headers:{"Idempotency-Key":request.headers.get("Idempotency-Key")??crypto.randomUUID()}}); }
