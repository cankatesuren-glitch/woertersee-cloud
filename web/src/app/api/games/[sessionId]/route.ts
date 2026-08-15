import { backend } from "@/lib/backend";
export async function GET(_:Request,ctx:{params:Promise<{sessionId:string}>}) { const {sessionId}=await ctx.params; return backend(`/api/v1/games/${sessionId}`); }
